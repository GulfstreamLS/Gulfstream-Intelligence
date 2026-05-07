"""add_projects_table_and_conversation_fk

Revision ID: a1b2c3d4e5f6
Revises: e0e646fc2c7d
Create Date: 2026-05-06 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'bf2e1c5f043b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('type', sa.String(50), nullable=False, server_default='IND'),
        sa.Column('indication', sa.String(500), nullable=True),
        sa.Column('therapeutic_area', sa.String(200), nullable=True),
        sa.Column('dev_phase', sa.String(100), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='Planning'),
        sa.Column('readiness_score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('authorities', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('icon_type', sa.String(50), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_projects_user_id', 'projects', ['user_id'])

    op.add_column('conversations', sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_conversations_project_id', 'conversations', 'projects', ['project_id'], ['id'], ondelete='SET NULL')
    op.create_index('ix_conversations_project_id', 'conversations', ['project_id'])


def downgrade() -> None:
    op.drop_index('ix_conversations_project_id', 'conversations')
    op.drop_constraint('fk_conversations_project_id', 'conversations', type_='foreignkey')
    op.drop_column('conversations', 'project_id')
    op.drop_index('ix_projects_user_id', 'projects')
    op.drop_table('projects')
