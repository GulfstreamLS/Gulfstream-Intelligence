"""add_ha_simulation_and_project_product_type

Revision ID: c1d2e3f4a5b6
Revises: b3c4d5e6f7a8, bf2e1c5f043b
Create Date: 2026-05-08 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c1d2e3f4a5b6"
down_revision: tuple = ("b3c4d5e6f7a8", "bf2e1c5f043b")
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    # Add product_type to projects
    op.add_column("projects", sa.Column("product_type", sa.String(100), nullable=True))

    # ha_simulation_sessions
    op.create_table(
        "ha_simulation_sessions",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_id", sa.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
        sa.Column("authority", sa.String(100), nullable=False),
        sa.Column("submission_type", sa.String(50), nullable=False),
        sa.Column("product_type", sa.String(100), nullable=False),
        sa.Column("stage", sa.String(100), nullable=False),
        sa.Column("focus_area", sa.String(100), nullable=False),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("critical_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("key_concerns_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("readiness_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("confidence_level", sa.String(20), nullable=False, server_default="Medium"),
        sa.Column("feedback_summary", sa.Text(), nullable=True),
        sa.Column("meeting_brief", sa.Text(), nullable=True),
        sa.Column("response_guidance", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ha_simulation_sessions_user_id", "ha_simulation_sessions", ["user_id"])
    op.create_index("ix_ha_simulation_sessions_project_id", "ha_simulation_sessions", ["project_id"])

    # ha_sim_questions
    op.create_table(
        "ha_sim_questions",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", sa.UUID(as_uuid=True), sa.ForeignKey("ha_simulation_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("topic", sa.String(100), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("rationale", sa.Text(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ha_sim_questions_session_id", "ha_sim_questions", ["session_id"])

    # ha_sim_concerns
    op.create_table(
        "ha_sim_concerns",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", sa.UUID(as_uuid=True), sa.ForeignKey("ha_simulation_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ha_sim_concerns_session_id", "ha_sim_concerns", ["session_id"])

    # ha_sim_followups
    op.create_table(
        "ha_sim_followups",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", sa.UUID(as_uuid=True), sa.ForeignKey("ha_simulation_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ha_sim_followups_session_id", "ha_sim_followups", ["session_id"])

    # ha_sim_actions
    op.create_table(
        "ha_sim_actions",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", sa.UUID(as_uuid=True), sa.ForeignKey("ha_simulation_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("priority", sa.String(20), nullable=False, server_default="Medium"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_ha_sim_actions_session_id", "ha_sim_actions", ["session_id"])


def downgrade() -> None:
    op.drop_table("ha_sim_actions")
    op.drop_table("ha_sim_followups")
    op.drop_table("ha_sim_concerns")
    op.drop_table("ha_sim_questions")
    op.drop_table("ha_simulation_sessions")
    op.drop_column("projects", "product_type")
