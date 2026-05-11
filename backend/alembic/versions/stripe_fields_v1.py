"""add stripe fields

Revision ID: stripe_fields_v1
Revises: a9b8c7d6e5f4
Create Date: 2026-05-11 15:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'stripe_fields_v1'
down_revision = 'a9b8c7d6e5f4'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('subscriptions', sa.Column('stripe_price_id', sa.String(length=255), nullable=True))

def downgrade() -> None:
    op.drop_column('subscriptions', 'stripe_price_id')
