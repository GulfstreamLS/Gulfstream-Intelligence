import json
import uuid
from collections.abc import AsyncGenerator

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, WebSocket, WebSocketDisconnect


from fastapi.responses import StreamingResponse

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from sqlalchemy import select
from app.db.session import get_db
from app.middleware.auth import get_current_user, get_user_or_none
from app.models.chat import MessageRole
from app.models.user import User
from app.schemas.chat import (
    ChatRequest,
    ConversationCreate,
    ConversationResponse,
    ConversationUpdate,
    MessageResponse,
)
from app.services.ai_service import ai_service
from app.services.chat_service import chat_service
from app.services.vector_service import vector_service
from app.services.document_processor import document_processor


router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id_fallback(db, current_user)
    return await chat_service.get_conversations(db, user_id)



@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    if not current_user:
        user_result = await db.execute(select(User).limit(1))
        current_user = user_result.scalar_one_or_none()
        if not current_user:
             raise HTTPException(status_code=500, detail="No users found in database.")

    return await chat_service.create_conversation(db, current_user.id, data)



@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id_fallback(db, current_user)
    convo = await chat_service.get_conversation(db, conversation_id, user_id)

    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return convo


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: uuid.UUID,
    data: ConversationUpdate,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id_fallback(db, current_user)
    convo = await chat_service.get_conversation(db, conversation_id, user_id)

    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return await chat_service.update_conversation(db, convo, data)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id_fallback(db, current_user)
    convo = await chat_service.get_conversation(db, conversation_id, user_id)

    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    await chat_service.delete_conversation(db, convo)


@router.patch("/conversations/{conversation_id}/authorities", response_model=ConversationResponse)
async def update_authorities(
    conversation_id: uuid.UUID,
    authorities: List[str],
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    """Update the active regulatory authorities for a conversation."""
    user_id = await _get_user_id_fallback(db, current_user)
    convo = await chat_service.get_conversation(db, conversation_id, user_id)

    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    convo.authorities = authorities
    await db.commit()
    await db.refresh(convo)
    return convo


@router.post("/conversations/{conversation_id}/upload")
async def upload_file_to_chat(
    conversation_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document to a conversation for regulatory analysis."""
    user_id = await _get_user_id_fallback(db, current_user)
    convo = await chat_service.get_conversation(db, conversation_id, user_id)

    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    content = await file.read()
    file_extension = file.filename.split(".")[-1].lower()

    from app.services.storage_service import storage_service
    file_url = await storage_service.upload_file(content, file.filename, file.content_type)


    # Save a record of the attachment in the chat history
    await chat_service.add_message(
        db, 
        conversation_id, 
        MessageRole.USER, 
        f"Attached: [{file.filename}]({file_url})"
    )


    # Store file metadata in conversation
    convo.active_file_id = uuid.uuid4()
    convo.metadata_ = convo.metadata_ or {}
    convo.metadata_["last_uploaded_filename"] = file.filename
    convo.metadata_["last_uploaded_url"] = file_url
    convo.metadata_["last_uploaded_type"] = file_extension
    convo.metadata_["last_uploaded_content"] = content.hex() 

    convo.metadata_["last_uploaded_type"] = file_extension
    await db.commit()

    # Trigger analysis if authorities are selected
    if convo.authorities:
        msg = await chat_service.perform_analysis_for_chat(
            db, conversation_id, content, file_extension, convo.authorities
        )
        return MessageResponse.model_validate(msg)

    return {"message": f"File '{file.filename}' uploaded. Select authorities to begin analysis."}




@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID,
    data: ChatRequest,
    current_user: Optional[User] = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    if not current_user:
        user_result = await db.execute(select(User).limit(1))
        current_user = user_result.scalar_one_or_none()
    
    user_id = current_user.id if current_user else None
    
    convo = await chat_service.get_conversation(db, conversation_id, user_id)

    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    await chat_service.add_message(db, conversation_id, MessageRole.USER, data.message)

    if not convo.title:
        title = await chat_service.auto_title_conversation(convo, data.message)
        convo.title = title

    model = data.model or convo.model or settings.DEFAULT_MODEL
    history = await chat_service.get_messages_as_dicts(db, conversation_id)

    from app.agents.prompts import get_persona
    system_prompt = get_persona(convo.authority) or convo.system_prompt or "You are a Regulatory Intelligence Assistant."

    # 1. RAG Context Injection
    selected_authorities = convo.authorities or []
    context_text = ""
    if selected_authorities:
        # Search knowledge base for relevant context based on user query
        context_sources = await vector_service.search_regulatory_context(
            db, data.message, authority=selected_authorities, limit=3
        )
        if context_sources:
            context_text = "\n\nREGULATORY CONTEXT:\n" + "\n".join([
                f"- {s.title} ({s.authority}): {s.content}" for s in context_sources
            ])

    # 2. Document Awareness
    document_context = ""
    if convo.active_file_id and convo.metadata_:
        filename = convo.metadata_.get("last_uploaded_filename")
        file_hex = convo.metadata_.get("last_uploaded_content")
        if file_hex:
            file_content = bytes.fromhex(file_hex)
            file_type = convo.metadata_.get("last_uploaded_type", "txt")
            doc_text = document_processor.extract_text(file_content, file_type)
            document_context = f"\n\nACTIVE DOCUMENT ({filename}):\n{doc_text[:5000]}"
            
    if document_context:
        system_prompt += f"\n\nCRITICAL: You have access to an uploaded document. If the user asks about 'this document' or 'the file', they are referring to the content below. NEVER say you cannot see files.\n{document_context}"

    if context_text:
        system_prompt += f"\n\nUse the following regulatory knowledge to help answer the user's question:\n{context_text}"

    # 3. Detect Analysis Request
    analysis_triggers = ["analyze", "analysis", "gap", "audit", "this document", "the document", "thoughts", "review", "check", "evaluate", "assess", "is this okay"]
    is_analysis_request = any(word in data.message.lower() for word in analysis_triggers)

    # 4. Detect Export Requests
    export_triggers = ["pdf", "docx", "word", "pptx", "ppt", "powerpoint", "presentation", "export", "download", "convert", "doc", "docs"]
    msg_lower = data.message.lower()
    is_export_request = any(word in msg_lower for word in export_triggers)


    # Use 'Global' if no authorities selected
    effective_authorities = selected_authorities or ["Global"]

    # HANDLE ANALYSIS COMMAND
    if is_analysis_request and convo.active_file_id:
        file_hex = convo.metadata_.get("last_uploaded_content")
        if file_hex:
            msg = await chat_service.perform_analysis_for_chat(
                db, conversation_id, bytes.fromhex(file_hex), 
                convo.metadata_.get("last_uploaded_type", "txt"), 
                effective_authorities
            )
            return StreamingResponse(_stream_analysis(msg.analysis_data), media_type="text/event-stream")

    # HANDLE EXPORT COMMAND
    if is_export_request and convo.active_file_id:
        last_analysis_msg = next((m for m in reversed(convo.messages) if m.is_analysis), None)
        if last_analysis_msg:
            from app.services.export_service import export_service
            filename = convo.metadata_.get("last_uploaded_filename", "Document")
            
            url = None
            file_type_label = ""
            if "pdf" in msg_lower: 
                url, file_type_label = await export_service.generate_pdf(last_analysis_msg.analysis_data, filename), "PDF"
            elif any(w in msg_lower for w in ["word", "docx", "doc", "docs"]): 
                url, file_type_label = await export_service.generate_docx(last_analysis_msg.analysis_data, filename), "Word"
            elif any(w in msg_lower for w in ["ppt", "pptx", "power", "presentation"]): 
                url, file_type_label = await export_service.generate_pptx(last_analysis_msg.analysis_data, filename), "PowerPoint"

            
            if url:
                ext = "pdf" if file_type_label == "PDF" else ("docx" if file_type_label == "Word" else "pptx")
                response_text = f"✅ **{file_type_label} Generated Successfully.**\n\nDownload: **[{filename}_Report.{ext}]({url})**"
                await chat_service.add_message(db, conversation_id, MessageRole.ASSISTANT, response_text)
                await db.commit()
                if data.stream:
                    async def _stream_export_simple():
                        yield f"data: {json.dumps({'type': 'delta', 'content': response_text})}\n\n"
                        yield f"data: {json.dumps({'type': 'done'})}\n\n"
                    return StreamingResponse(_stream_export_simple(), media_type="text/event-stream")
                return MessageResponse(id=uuid.uuid4(), conversation_id=conversation_id, role=MessageRole.ASSISTANT, content=response_text, created_at=datetime.utcnow())




    if data.stream:

        return StreamingResponse(
            _stream_response(db, convo.id, history, model, system_prompt),
            media_type="text/event-stream",
            headers={"X-Conversation-Id": str(conversation_id)},
        )

    full_response = ""
    async for chunk in ai_service.stream_chat(history, model, system_prompt):
        full_response += chunk


    msg = await chat_service.add_message(db, conversation_id, MessageRole.ASSISTANT, full_response)
    return MessageResponse.model_validate(msg)


async def _stream_response(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    history: list[dict],
    model: str,
    system_prompt: str | None,
) -> AsyncGenerator[str, None]:
    full_response = ""
    try:
        async for chunk in ai_service.stream_chat(history, model, system_prompt):
            full_response += chunk
            yield f"data: {json.dumps({'type': 'delta', 'content': chunk})}\n\n"

        msg = await chat_service.add_message(db, conversation_id, MessageRole.ASSISTANT, full_response)
        await db.commit()
        yield f"data: {json.dumps({'type': 'done', 'message_id': str(msg.id)})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

async def _stream_analysis(analysis_data: dict) -> AsyncGenerator[str, None]:
    yield f"data: {json.dumps({'type': 'analysis', 'data': analysis_data})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"



@router.websocket("/ws/{conversation_id}")
async def websocket_chat(
    websocket: WebSocket,
    conversation_id: uuid.UUID,
    token: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    try:
        from app.services.auth_service import auth_service
        current_user = await auth_service.get_current_user(db, token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    convo = await chat_service.get_conversation(db, conversation_id, current_user.id)
    if not convo:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                user_message = payload.get("message")
                model = payload.get("model") or convo.model or settings.DEFAULT_MODEL
            except json.JSONDecodeError:
                user_message = data
                model = convo.model or settings.DEFAULT_MODEL

            if not user_message:
                continue

            await chat_service.add_message(db, conversation_id, MessageRole.USER, user_message)
            
            from app.agents.prompts import get_persona
            system_prompt = get_persona(convo.authority) or convo.system_prompt
            
            history = await chat_service.get_messages_as_dicts(db, conversation_id)
            
            full_response = ""
            async for chunk in ai_service.stream_chat(history, model, system_prompt):
                full_response += chunk
                await websocket.send_text(json.dumps({"type": "delta", "content": chunk}))
                
            if full_response:
                msg = await chat_service.add_message(db, conversation_id, MessageRole.ASSISTANT, full_response)
                await db.commit()
                await websocket.send_text(json.dumps({"type": "done", "message_id": str(msg.id)}))

    except WebSocketDisconnect:
        pass


async def _get_user_id_fallback(db: AsyncSession, user: Optional[User]) -> uuid.UUID:
    if user:
        return user.id
    user_result = await db.execute(select(User).limit(1))
    mock_user = user_result.scalar_one_or_none()
    if not mock_user:
        raise HTTPException(status_code=500, detail="No users found in database.")
    return mock_user.id
