import datetime
import json
import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.middleware.auth import get_user_or_none
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
from app.services.document_processor import document_processor
from app.services.vector_service import vector_service

router = APIRouter(prefix="/chat", tags=["chat"])

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
}

# ── Unified send endpoint ──────────────────────────────────────────────────────


@router.post("/send")
async def send(
    conversation_id: str | None = Form(None),
    message: str | None = Form(None),
    authorities: str | None = Form(None),  # JSON-encoded list e.g. '["EMA","FDA"]'
    model: str | None = Form(None),
    file: UploadFile | None = File(None),
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    """Single endpoint: create/get conversation, attach file, set authorities, stream AI response."""
    user_id = await _get_user_id_fallback(db, current_user)

    # 1. Get or create conversation
    new_convo_payload = None
    if conversation_id:
        convo = await chat_service.get_conversation(db, uuid.UUID(conversation_id), user_id)
        if not convo:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    else:
        convo = await chat_service.create_conversation(
            db, user_id, ConversationCreate(model=model or settings.DEFAULT_MODEL)
        )
        new_convo_payload = {
            "id": str(convo.id),
            "model": convo.model,
            "created_at": convo.created_at.isoformat(),
            "updated_at": convo.updated_at.isoformat(),
        }

    # 2. Update authorities if provided
    if authorities:
        try:
            convo.authorities = json.loads(authorities)
        except (json.JSONDecodeError, ValueError):
            pass

    # 3. Handle file upload
    if file:
        content = await file.read()
        file_extension = file.filename.split(".")[-1].lower()
        from app.services.storage_service import storage_service

        file_url = await storage_service.upload_file(content, file.filename, file.content_type)
        convo.active_file_id = uuid.uuid4()
        convo.metadata_ = convo.metadata_ or {}
        convo.metadata_["last_uploaded_filename"] = file.filename
        convo.metadata_["last_uploaded_url"] = file_url
        convo.metadata_["last_uploaded_type"] = file_extension
        convo.metadata_["last_uploaded_content"] = content.hex()

    await db.commit()
    await db.refresh(convo)

    # 4. Add user message to DB
    if message:
        await chat_service.add_message(db, convo.id, MessageRole.USER, message)
        if not convo.title:
            convo.title = await chat_service.auto_title_conversation(convo, message)
            await db.commit()

    # 5. If no message — just confirm (file-only upload)
    if not message:
        return StreamingResponse(
            _stream_no_message(new_convo_payload),
            media_type="text/event-stream",
            headers=SSE_HEADERS,
        )

    # 6. Build AI context
    from app.agents.prompts import get_persona

    selected_authorities = convo.authorities or []
    system_prompt = (
        get_persona(convo.authority) or convo.system_prompt or "You are a Regulatory Intelligence Assistant."
    )

    if selected_authorities:
        sources = await vector_service.search_regulatory_context(db, message, authority=selected_authorities, limit=3)
        if sources:
            system_prompt += "\n\nREGULATORY CONTEXT:\n" + "\n".join(
                f"- {s.title} ({s.authority}): {s.content}" for s in sources
            )

    if convo.active_file_id and convo.metadata_:
        file_hex = convo.metadata_.get("last_uploaded_content")
        if file_hex:
            doc_text = document_processor.extract_text(
                bytes.fromhex(file_hex), convo.metadata_.get("last_uploaded_type", "txt")
            )
            system_prompt += (
                f"\n\nCRITICAL: You have access to an uploaded document. NEVER say you cannot see files."
                f"\n\nACTIVE DOCUMENT ({convo.metadata_.get('last_uploaded_filename', 'document')}):\n{doc_text[:5000]}"
            )

    # 7. Detect analysis
    analysis_triggers = [
        "analyze",
        "analysis",
        "gap",
        "audit",
        "this document",
        "the document",
        "thoughts",
        "review",
        "check",
        "evaluate",
        "assess",
        "is this okay",
    ]
    is_analysis = any(t in message.lower() for t in analysis_triggers) and bool(convo.active_file_id)

    file_bytes, file_type = None, None
    if is_analysis and convo.metadata_:
        hex_val = convo.metadata_.get("last_uploaded_content")
        if hex_val:
            file_bytes = bytes.fromhex(hex_val)
            file_type = convo.metadata_.get("last_uploaded_type", "txt")

    # 8. Detect export
    export_triggers = ["pdf", "docx", "word", "pptx", "ppt", "powerpoint", "export", "download", "convert"]
    msg_lower = message.lower()
    is_export = any(t in msg_lower for t in export_triggers) and bool(convo.active_file_id)

    if is_export:
        last_analysis = next((m for m in reversed(convo.messages) if m.is_analysis), None)
        if last_analysis:
            from app.services.export_service import export_service

            fname = convo.metadata_.get("last_uploaded_filename", "Document")
            url, label = None, ""
            if "pdf" in msg_lower:
                url, label = await export_service.generate_pdf(last_analysis.analysis_data, fname), "PDF"
            elif any(w in msg_lower for w in ["word", "docx", "doc"]):
                url, label = await export_service.generate_docx(last_analysis.analysis_data, fname), "Word"
            elif any(w in msg_lower for w in ["ppt", "pptx", "power", "presentation"]):
                url, label = await export_service.generate_pptx(last_analysis.analysis_data, fname), "PowerPoint"
            if url:
                ext = "pdf" if label == "PDF" else ("docx" if label == "Word" else "pptx")
                text = f"✅ **{label} Generated Successfully.**\n\nDownload: **[{fname}_Report.{ext}]({url})**"
                await chat_service.add_message(db, convo.id, MessageRole.ASSISTANT, text)
                await db.commit()
                return StreamingResponse(
                    _stream_export_response(text, new_convo_payload),
                    media_type="text/event-stream",
                    headers=SSE_HEADERS,
                )

    history = await chat_service.get_messages_as_dicts(db, convo.id)
    used_model = model or convo.model or settings.DEFAULT_MODEL
    eff_authorities = selected_authorities or ["Global"]

    return StreamingResponse(
        _stream_send(
            db,
            convo.id,
            history,
            used_model,
            system_prompt,
            new_convo_payload,
            is_analysis and file_bytes is not None,
            file_bytes,
            file_type,
            eff_authorities,
        ),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


async def _stream_no_message(new_convo_payload: dict | None) -> AsyncGenerator[str, None]:
    if new_convo_payload:
        yield f"data: {json.dumps({'type': 'conversation_ready', **new_convo_payload})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"


async def _stream_export_response(text: str, new_convo_payload: dict | None) -> AsyncGenerator[str, None]:
    if new_convo_payload:
        yield f"data: {json.dumps({'type': 'conversation_ready', **new_convo_payload})}\n\n"
    yield f"data: {json.dumps({'type': 'delta', 'content': text})}\n\n"
    yield f"data: {json.dumps({'type': 'done'})}\n\n"


async def _stream_send(
    db: AsyncSession,
    conversation_id: uuid.UUID,
    history: list[dict],
    model: str,
    system_prompt: str | None,
    new_convo_payload: dict | None,
    run_analysis: bool,
    file_bytes: bytes | None,
    file_type: str | None,
    authorities: list[str],
) -> AsyncGenerator[str, None]:
    try:
        if new_convo_payload:
            yield f"data: {json.dumps({'type': 'conversation_ready', **new_convo_payload})}\n\n"

        if run_analysis and file_bytes:
            msg = await chat_service.perform_analysis_for_chat(db, conversation_id, file_bytes, file_type, authorities)
            analysis_payload = {
                "type": "analysis",
                "content": msg.content,
                "data": msg.analysis_data,
                "message_id": str(msg.id),
            }
            yield f"data: {json.dumps(analysis_payload)}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'message_id': str(msg.id)})}\n\n"
            return

        full_response = ""
        async for chunk in ai_service.stream_chat(history, model, system_prompt):
            full_response += chunk
            yield f"data: {json.dumps({'type': 'delta', 'content': chunk})}\n\n"

        msg = await chat_service.add_message(db, conversation_id, MessageRole.ASSISTANT, full_response)
        await db.commit()
        yield f"data: {json.dumps({'type': 'done', 'message_id': str(msg.id)})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User | None = Depends(get_user_or_none),
    db: AsyncSession = Depends(get_db),
):
    user_id = await _get_user_id_fallback(db, current_user)
    return await chat_service.get_conversations(db, user_id)


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user: User | None = Depends(get_user_or_none),
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
    current_user: User | None = Depends(get_user_or_none),
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
    current_user: User | None = Depends(get_user_or_none),
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
    current_user: User | None = Depends(get_user_or_none),
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
    authorities: list[str],
    current_user: User | None = Depends(get_user_or_none),
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
    current_user: User | None = Depends(get_user_or_none),
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

    # Store file metadata in conversation
    convo.active_file_id = uuid.uuid4()
    convo.metadata_ = convo.metadata_ or {}
    convo.metadata_["last_uploaded_filename"] = file.filename
    convo.metadata_["last_uploaded_url"] = file_url
    convo.metadata_["last_uploaded_type"] = file_extension
    convo.metadata_["last_uploaded_content"] = content.hex()
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
    current_user: User | None = Depends(get_user_or_none),
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

    system_prompt = (
        get_persona(convo.authority) or convo.system_prompt or "You are a Regulatory Intelligence Assistant."
    )

    # 1. RAG Context Injection
    selected_authorities = convo.authorities or []
    context_text = ""
    if selected_authorities:
        # Search knowledge base for relevant context based on user query
        context_sources = await vector_service.search_regulatory_context(
            db, data.message, authority=selected_authorities, limit=3
        )
        if context_sources:
            context_text = "\n\nREGULATORY CONTEXT:\n" + "\n".join(
                [f"- {s.title} ({s.authority}): {s.content}" for s in context_sources]
            )

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
        prompt_warning = (
            "\n\nCRITICAL: You have access to an uploaded document. "
            "If the user asks about 'this document' or 'the file', "
            "they are referring to the content below. NEVER say you cannot see files.\n"
        )
        system_prompt += f"{prompt_warning}{document_context}"

    if context_text:
        system_prompt += (
            f"\n\nUse the following regulatory knowledge to help answer the user's question:\n{context_text}"
        )

    # 3. Detect Analysis Request
    analysis_triggers = [
        "analyze",
        "analysis",
        "gap",
        "audit",
        "this document",
        "the document",
        "thoughts",
        "review",
        "check",
        "evaluate",
        "assess",
        "is this okay",
    ]
    is_analysis_request = any(word in data.message.lower() for word in analysis_triggers)

    # 4. Detect Export Requests
    export_triggers = [
        "pdf",
        "docx",
        "word",
        "pptx",
        "ppt",
        "powerpoint",
        "presentation",
        "export",
        "download",
        "convert",
        "doc",
        "docs",
    ]
    msg_lower = data.message.lower()
    is_export_request = any(word in msg_lower for word in export_triggers)

    # Use 'Global' if no authorities selected
    effective_authorities = selected_authorities or ["Global"]

    # HANDLE ANALYSIS COMMAND
    if is_analysis_request and convo.active_file_id:
        file_hex = convo.metadata_.get("last_uploaded_content")
        if file_hex:
            msg = await chat_service.perform_analysis_for_chat(
                db,
                conversation_id,
                bytes.fromhex(file_hex),
                convo.metadata_.get("last_uploaded_type", "txt"),
                effective_authorities,
            )
            return StreamingResponse(
                _stream_analysis(msg),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no",
                },
            )

    # HANDLE EXPORT COMMAND
    if is_export_request and convo.active_file_id:
        last_analysis_msg = next((m for m in reversed(convo.messages) if m.is_analysis), None)
        if last_analysis_msg:
            from app.services.export_service import export_service

            filename = convo.metadata_.get("last_uploaded_filename", "Document")

            url = None
            file_type_label = ""
            if "pdf" in msg_lower:
                url, file_type_label = (
                    await export_service.generate_pdf(last_analysis_msg.analysis_data, filename),
                    "PDF",
                )
            elif any(w in msg_lower for w in ["word", "docx", "doc", "docs"]):
                url, file_type_label = (
                    await export_service.generate_docx(last_analysis_msg.analysis_data, filename),
                    "Word",
                )
            elif any(w in msg_lower for w in ["ppt", "pptx", "power", "presentation"]):
                url, file_type_label = (
                    await export_service.generate_pptx(last_analysis_msg.analysis_data, filename),
                    "PowerPoint",
                )

            if url:
                ext = "pdf" if file_type_label == "PDF" else ("docx" if file_type_label == "Word" else "pptx")
                response_text = (
                    f"✅ **{file_type_label} Generated Successfully.**\n\n"
                    f"Download: **[{filename}_Report.{ext}]({url})**"
                )
                await chat_service.add_message(db, conversation_id, MessageRole.ASSISTANT, response_text)
                await db.commit()
                if data.stream:

                    async def _stream_export_simple():
                        yield f"data: {json.dumps({'type': 'delta', 'content': response_text})}\n\n"
                        yield f"data: {json.dumps({'type': 'done'})}\n\n"

                    return StreamingResponse(
                        _stream_export_simple(),
                        media_type="text/event-stream",
                        headers={
                            "Cache-Control": "no-cache",
                            "Connection": "keep-alive",
                            "X-Accel-Buffering": "no",
                        },
                    )
                return MessageResponse(
                    id=uuid.uuid4(),
                    conversation_id=conversation_id,
                    role=MessageRole.ASSISTANT,
                    content=response_text,
                    created_at=datetime.utcnow(),
                )

    if data.stream:
        return StreamingResponse(
            _stream_response(db, convo.id, history, model, system_prompt),
            media_type="text/event-stream",
            headers={
                "X-Conversation-Id": str(conversation_id),
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
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


async def _stream_analysis(msg) -> AsyncGenerator[str, None]:
    analysis_payload = {
        "type": "analysis",
        "content": msg.content,
        "data": msg.analysis_data,
        "message_id": str(msg.id),
    }
    yield f"data: {json.dumps(analysis_payload)}\n\n"
    yield f"data: {json.dumps({'type': 'done', 'message_id': str(msg.id)})}\n\n"


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


async def _get_user_id_fallback(db: AsyncSession, user: User | None) -> uuid.UUID:
    if user:
        return user.id
    user_result = await db.execute(select(User).limit(1))
    mock_user = user_result.scalar_one_or_none()
    if not mock_user:
        raise HTTPException(status_code=500, detail="No users found in database.")
    return mock_user.id
