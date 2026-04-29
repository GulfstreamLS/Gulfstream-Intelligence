import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.chat import MessageRole


class MessageCreate(BaseModel):
    role: MessageRole = MessageRole.USER
    content: str = Field(..., min_length=1, max_length=32_000)


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: MessageRole
    content: str
    token_count: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    title: str | None = None
    model: str = "claude-sonnet-4-6"
    system_prompt: str | None = None


class ConversationUpdate(BaseModel):
    title: str | None = None
    system_prompt: str | None = None


class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str | None
    model: str
    system_prompt: str | None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=32_000)
    model: str | None = None
    stream: bool = True


class ChatStreamChunk(BaseModel):
    type: str  # "delta" | "done" | "error"
    content: str | None = None
    conversation_id: uuid.UUID | None = None
    message_id: uuid.UUID | None = None
    error: str | None = None
