"""add is_temporary to conversations

Revision ID: c3d4e5f6a7b8
Revises: b9f3e1a2c4d7
Create Date: 2026-05-18 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b9f3e1a2c4d7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'conversations',
        sa.Column('is_temporary', sa.Boolean(), nullable=False, server_default='false')
    )
    op.create_index('ix_conversations_is_temporary', 'conversations', ['is_temporary'])


def downgrade() -> None:
    op.drop_index('ix_conversations_is_temporary', table_name='conversations')
    op.drop_column('conversations', 'is_temporary')
