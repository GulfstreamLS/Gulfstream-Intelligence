"""add_lookup_values

Revision ID: d2e3f4a5b6c7
Revises: c1d2e3f4a5b6
Create Date: 2026-05-08 16:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d2e3f4a5b6c7"
down_revision = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


_DEFAULTS = {
    "therapeutic_area": [
        "Rare Disease", "Oncology", "Infectious Disease", "Metabolic",
        "Neurology", "Cardiology", "Immunology", "Ophthalmology",
        "Dermatology", "Gastroenterology", "Respiratory", "Hematology",
    ],
    "dev_phase": [
        "Preclinical", "Phase 1", "Phase 2", "Phase 3", "BLA/MAA",
        "Pre-submission", "Post-approval",
    ],
    "product_type": [
        "Small Molecule", "Biologic", "Cell & Gene Therapy", "Gene Therapy",
        "Vaccine", "Medical Device", "Combination Product", "Radiopharmaceutical",
    ],
}


def upgrade() -> None:
    op.create_table(
        "lookup_values",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column("category", sa.String(50), nullable=False, index=True),
        sa.Column("value", sa.String(200), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("category", "value", name="uq_lookup_category_value"),
    )
    # Seed defaults using raw SQL to avoid UUID type casting issues
    conn = op.get_bind()
    for category, values in _DEFAULTS.items():
        for value in values:
            conn.execute(
                sa.text(
                    "INSERT INTO lookup_values (id, category, value, is_default)"
                    " VALUES (gen_random_uuid(), :category, :value, true)"
                    " ON CONFLICT (category, value) DO NOTHING"
                ),
                {"category": category, "value": value},
            )


def downgrade() -> None:
    op.drop_table("lookup_values")
