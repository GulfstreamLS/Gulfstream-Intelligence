import uuid
from datetime import datetime
from typing import Optional

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
    is_analysis: bool = False
    analysis_data: dict | None = None
    attached_filename: Optional[str] = None
    attached_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    title: str | None = None
    model: str = "claude-sonnet-4-6"
    authority: str | None = None
    authorities: list[str] | None = None
    system_prompt: str | None = None


class ConversationUpdate(BaseModel):
    title: str | None = None
    system_prompt: str | None = None
    project_id: uuid.UUID | None = None


class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str | None
    model: str
    authority: str | None = None
    authorities: list[str] | None = None
    active_file_id: uuid.UUID | None = None
    system_prompt: str | None = None
    project_id: Optional[uuid.UUID] = None
    project_name: Optional[str] = None
    uploaded_filename: Optional[str] = None
    uploaded_url: Optional[str] = None
    uploaded_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=32_000)
    model: str | None = None
    authorities: list[str] | None = None
    stream: bool = True


class ChatStreamChunk(BaseModel):
    type: str  # "delta" | "done" | "error"
    content: str | None = None
    conversation_id: uuid.UUID | None = None
    message_id: uuid.UUID | None = None
    error: str | None = None
