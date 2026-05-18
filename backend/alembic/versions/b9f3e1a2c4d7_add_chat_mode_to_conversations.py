"""add_chat_mode_to_conversations

Revision ID: b9f3e1a2c4d7
Revises: 87c2f7142e7a
Create Date: 2026-05-18 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b9f3e1a2c4d7"
down_revision: str | None = "87c2f7142e7a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "conversations",
        sa.Column("chat_mode", sa.String(20), nullable=True, server_default="program"),
    )


def downgrade() -> None:
    op.drop_column("conversations", "chat_mode")
