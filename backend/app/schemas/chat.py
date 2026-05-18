import os
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.chat import MessageRole


def _resolve_media_url(url: str | None) -> str | None:
    """
    Ensure local media paths are served with the correct BASE_URL.

    Handles three cases:
    - None / empty → unchanged
    - Already an external URL (https://) → unchanged (GCS etc.)
    - Relative path (/media/...) → prepend BASE_URL
    - Old stored URL with localhost:8000 → replace prefix with BASE_URL
    """
    if not url:
        return url
    if url.startswith("https://"):
        return url
    base = os.getenv("BASE_URL", "http://localhost:8000").rstrip("/")
    if url.startswith("/media/"):
        return f"{base}{url}"
    if "localhost:8000" in url:
        return url.replace("http://localhost:8000", base, 1)
    return url


class MessageCreate(BaseModel):
    role: MessageRole = MessageRole.USER
    content: str = Field(..., min_length=1, max_length=32_000)


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: MessageRole
    content: str
    model: Optional[str] = None
    token_count: int | None
    is_analysis: bool = False
    analysis_data: dict | None = None
    attached_filename: Optional[str] = None
    attached_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("attached_url", mode="before")
    @classmethod
    def resolve_attached_url(cls, v: str | None) -> str | None:
        return _resolve_media_url(v)


class ConversationCreate(BaseModel):
    title: str | None = None
    model: str = "claude-sonnet-4-6"
    authority: str | None = None
    authorities: list[str] | None = None
    system_prompt: str | None = None
    chat_mode: str | None = "program"


class ConversationUpdate(BaseModel):
    title: str | None = None
    system_prompt: str | None = None
    project_id: uuid.UUID | None = None
    model: str | None = None
    chat_mode: str | None = None
    is_temporary: bool | None = None


class ConversationResponse(BaseModel):
    id: uuid.UUID
    title: str | None
    model: str
    chat_mode: str | None = "program"
    is_temporary: bool = False
    authority: str | None = None
    authorities: list[str] | None = None
    active_file_id: uuid.UUID | None = None
    system_prompt: str | None = None
    project_id: Optional[uuid.UUID] = None
    project_name: Optional[str] = None
    organization_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None
    uploaded_filename: Optional[str] = None
    uploaded_url: Optional[str] = None
    uploaded_type: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []
    models_used: list[str] = []

    model_config = {"from_attributes": True}

    @field_validator("uploaded_url", mode="before")
    @classmethod
    def resolve_uploaded_url(cls, v: str | None) -> str | None:
        return _resolve_media_url(v)


class ConversationListResponse(BaseModel):
    items: list[ConversationResponse]
    total: int
    page: int
    page_size: int
    pages: int


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
