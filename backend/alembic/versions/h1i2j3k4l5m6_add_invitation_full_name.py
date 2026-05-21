"""add invitation full name

Revision ID: h1i2j3k4l5m6
Revises: g2h3i4j5k6l7
Create Date: 2026-05-21 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "h1i2j3k4l5m6"
down_revision = "g2h3i4j5k6l7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("invitations", sa.Column("full_name", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("invitations", "full_name")
