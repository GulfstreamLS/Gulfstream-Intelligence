"""add_attachment_fields_to_messages

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f6
Create Date: 2026-05-07 18:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'b3c4d5e6f7a8'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('messages', sa.Column('attached_filename', sa.String(500), nullable=True))
    op.add_column('messages', sa.Column('attached_url', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('messages', 'attached_url')
    op.drop_column('messages', 'attached_filename')
