import json
import uuid
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.middleware.auth import get_current_user
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

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await chat_service.get_conversations(db, current_user.id)


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await chat_service.create_conversation(db, current_user.id, data)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    convo = await chat_service.get_conversation(db, conversation_id, current_user.id)
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return convo


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: uuid.UUID,
    data: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    convo = await chat_service.get_conversation(db, conversation_id, current_user.id)
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return await chat_service.update_conversation(db, convo, data)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    convo = await chat_service.get_conversation(db, conversation_id, current_user.id)
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    await chat_service.delete_conversation(db, convo)


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID,
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    convo = await chat_service.get_conversation(db, conversation_id, current_user.id)
    if not convo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    await chat_service.add_message(db, conversation_id, MessageRole.USER, data.message)

    if not convo.title:
        title = await chat_service.auto_title_conversation(convo, data.message)
        convo.title = title

    model = data.model or convo.model or settings.DEFAULT_MODEL
    history = await chat_service.get_messages_as_dicts(db, conversation_id)

    from app.agents.prompts import get_persona
    system_prompt = get_persona(convo.authority) or convo.system_prompt

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

