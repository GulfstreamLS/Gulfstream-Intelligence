"""add_simulation_source_context

Revision ID: f7a1c2d3e4b5
Revises: e5f6a7b8c9d0
Create Date: 2026-05-20 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f7a1c2d3e4b5"
down_revision: str | None = "e5f6a7b8c9d0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("ha_simulation_sessions", sa.Column("mode", sa.String(20), nullable=True))
    op.add_column("ha_simulation_sessions", sa.Column("simulation_purpose", sa.String(120), nullable=True))
    op.add_column("ha_simulation_sessions", sa.Column("pasted_questions", sa.Text(), nullable=True))
    op.add_column("ha_simulation_sessions", sa.Column("manual_scenario", sa.Text(), nullable=True))
    op.add_column("ha_simulation_sessions", sa.Column("included_sources", postgresql.JSONB(), nullable=True))
    op.add_column("ha_simulation_sessions", sa.Column("supplemental_document_ids", postgresql.JSONB(), nullable=True))
    op.add_column("analysis_documents", sa.Column("extracted_text", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("analysis_documents", "extracted_text")
    op.drop_column("ha_simulation_sessions", "supplemental_document_ids")
    op.drop_column("ha_simulation_sessions", "included_sources")
    op.drop_column("ha_simulation_sessions", "manual_scenario")
    op.drop_column("ha_simulation_sessions", "pasted_questions")
    op.drop_column("ha_simulation_sessions", "simulation_purpose")
    op.drop_column("ha_simulation_sessions", "mode")
