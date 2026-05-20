"""add gap assessment runs

Revision ID: g2h3i4j5k6l7
Revises: 9a8b7c6d5e4f
Create Date: 2026-05-20 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "g2h3i4j5k6l7"
down_revision: Union[str, None] = "9a8b7c6d5e4f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "gap_assessment_runs",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("source_type", sa.String(length=100), nullable=False),
        sa.Column("assessment_type", sa.String(length=150), nullable=False),
        sa.Column("regions", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("document_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("documents_reviewed", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("confidence_level", sa.String(length=50), nullable=False),
        sa.Column("readiness_score", sa.Integer(), nullable=False),
        sa.Column("critical_gaps_count", sa.Integer(), nullable=False),
        sa.Column("high_priority_count", sa.Integer(), nullable=False),
        sa.Column("recommendations_count", sa.Integer(), nullable=False),
        sa.Column("top_risks", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("recommendations", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_gap_assessment_runs_organization_id"), "gap_assessment_runs", ["organization_id"], unique=False)
    op.create_index(op.f("ix_gap_assessment_runs_project_id"), "gap_assessment_runs", ["project_id"], unique=False)
    op.create_index(op.f("ix_gap_assessment_runs_user_id"), "gap_assessment_runs", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_gap_assessment_runs_user_id"), table_name="gap_assessment_runs")
    op.drop_index(op.f("ix_gap_assessment_runs_project_id"), table_name="gap_assessment_runs")
    op.drop_index(op.f("ix_gap_assessment_runs_organization_id"), table_name="gap_assessment_runs")
    op.drop_table("gap_assessment_runs")
