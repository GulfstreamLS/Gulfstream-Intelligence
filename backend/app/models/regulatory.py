import uuid
from enum import StrEnum

from pgvector.sqlalchemy import Vector
from sqlalchemy import Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class SeverityLevel(StrEnum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RegulatorySource(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "regulatory_sources"

    authority: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str | None] = mapped_column(String(1000))
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB)
    embedding: Mapped[Vector] = mapped_column(Vector(1536))  # OpenAI embedding dimension


class AnalysisDocument(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "analysis_documents"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    organization_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50))  # pdf, docx, etc.
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    authority: Mapped[str | None] = mapped_column(String(100), index=True) # Added for filtering
    summary: Mapped[str | None] = mapped_column(Text)
    confidence_score: Mapped[float | None] = mapped_column(Float)

    gaps: Mapped[list["Gap"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    insights: Mapped[list["Insight"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    actions: Mapped[list["Action"]] = relationship(back_populates="document", cascade="all, delete-orphan")


class Gap(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "core_gaps"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("analysis_documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    domain: Mapped[str] = mapped_column(String(100))  # CMC, Nonclinical, etc.
    severity: Mapped[SeverityLevel] = mapped_column(String(20), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    regulatory_impact: Mapped[str] = mapped_column(Text)
    recommended_action: Mapped[str] = mapped_column(Text)
    quoted_excerpt: Mapped[str | None] = mapped_column(Text)
    page_reference: Mapped[str | None] = mapped_column(String(50))

    document: Mapped["AnalysisDocument"] = relationship(back_populates="gaps")


class Insight(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "core_insights"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("analysis_documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))

    document: Mapped["AnalysisDocument"] = relationship(back_populates="insights")


class Action(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "core_actions"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("analysis_documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str | None] = mapped_column(String(20))

    document: Mapped["AnalysisDocument"] = relationship(back_populates="actions")
