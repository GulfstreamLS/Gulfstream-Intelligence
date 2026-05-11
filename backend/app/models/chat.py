import uuid
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class Conversation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "conversations"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True)
    title: Mapped[str | None] = mapped_column(String(500))
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    authority: Mapped[str | None] = mapped_column(String(100))
    authorities: Mapped[list[str] | None] = mapped_column(MutableList.as_mutable(JSONB))
    active_file_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    system_prompt: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict | None] = mapped_column("metadata", MutableDict.as_mutable(JSONB))

    user: Mapped["User"] = relationship(back_populates="conversations")
    project: Mapped["Project"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")

    @property
    def user_full_name(self) -> str | None:
        return self.user.full_name if self.user else None

    @property
    def user_email(self) -> str | None:
        return self.user.email if self.user else None

    @property
    def project_name(self) -> str | None:
        return self.project.name if self.project else None

    @property
    def uploaded_filename(self) -> str | None:
        return (self.metadata_ or {}).get("last_uploaded_filename")

    @property
    def uploaded_url(self) -> str | None:
        return (self.metadata_ or {}).get("last_uploaded_url")

    @property
    def uploaded_type(self) -> str | None:
        return (self.metadata_ or {}).get("last_uploaded_type")


class Message(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[MessageRole] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    token_count: Mapped[int | None] = mapped_column(Integer)
    is_analysis: Mapped[bool] = mapped_column(default=False)
    analysis_data: Mapped[dict | None] = mapped_column(MutableDict.as_mutable(JSONB))
    tool_calls: Mapped[dict | None] = mapped_column(MutableDict.as_mutable(JSONB))
    tool_results: Mapped[dict | None] = mapped_column(MutableDict.as_mutable(JSONB))
    attached_filename: Mapped[str | None] = mapped_column(String(500))
    attached_url: Mapped[str | None] = mapped_column(Text)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")
