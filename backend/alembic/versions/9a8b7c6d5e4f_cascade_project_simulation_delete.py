"""cascade_project_simulation_delete

Revision ID: 9a8b7c6d5e4f
Revises: f7a1c2d3e4b5
Create Date: 2026-05-20 13:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9a8b7c6d5e4f"
down_revision: str | None = "f7a1c2d3e4b5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(
        "ha_simulation_sessions_project_id_fkey",
        "ha_simulation_sessions",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "ha_simulation_sessions_project_id_fkey",
        "ha_simulation_sessions",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ha_simulation_sessions_project_id_fkey",
        "ha_simulation_sessions",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "ha_simulation_sessions_project_id_fkey",
        "ha_simulation_sessions",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="SET NULL",
    )
