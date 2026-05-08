import uuid

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class SimulationSession(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ha_simulation_sessions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Input parameters
    authority: Mapped[str] = mapped_column(String(100), nullable=False)
    submission_type: Mapped[str] = mapped_column(String(50), nullable=False)
    product_type: Mapped[str] = mapped_column(String(100), nullable=False)
    stage: Mapped[str] = mapped_column(String(100), nullable=False)
    focus_area: Mapped[str] = mapped_column(String(100), nullable=False)

    # Computed stats
    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    critical_count: Mapped[int] = mapped_column(Integer, default=0)
    key_concerns_count: Mapped[int] = mapped_column(Integer, default=0)
    readiness_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_level: Mapped[str] = mapped_column(String(20), default="Medium")

    # LLM-generated text outputs
    feedback_summary: Mapped[str | None] = mapped_column(Text)
    meeting_brief: Mapped[str | None] = mapped_column(Text)
    response_guidance: Mapped[str | None] = mapped_column(Text)

    # Relationships
    questions: Mapped[list["SimQuestion"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    concerns: Mapped[list["SimConcern"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    followups: Mapped[list["SimFollowup"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    actions: Mapped[list["SimAction"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class SimQuestion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ha_sim_questions"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ha_simulation_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    topic: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    session: Mapped["SimulationSession"] = relationship(back_populates="questions")


class SimConcern(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ha_sim_concerns"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ha_simulation_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)

    session: Mapped["SimulationSession"] = relationship(back_populates="concerns")


class SimFollowup(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ha_sim_followups"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ha_simulation_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)

    session: Mapped["SimulationSession"] = relationship(back_populates="followups")


class SimAction(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ha_sim_actions"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ha_simulation_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="Medium")

    session: Mapped["SimulationSession"] = relationship(back_populates="actions")
