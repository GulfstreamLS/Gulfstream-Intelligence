import uuid

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin


class LookupValue(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "lookup_values"

    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    value: Mapped[str] = mapped_column(String(200), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    __table_args__ = (UniqueConstraint("category", "value", name="uq_lookup_category_value"),)
