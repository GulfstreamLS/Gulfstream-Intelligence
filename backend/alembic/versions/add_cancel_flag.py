"""add cancel at period end to subscription

Revision ID: add_cancel_flag
Revises: stripe_fields_v1
Create Date: 2026-05-12 13:22:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_cancel_flag'
down_revision: Union[str, None] = 'stripe_fields_v1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('subscriptions', sa.Column('cancel_at_period_end', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('subscriptions', 'cancel_at_period_end')
