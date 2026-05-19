"""link analysis documents to chats

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-19 00:00:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "analysis_documents",
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "analysis_documents",
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        op.f("ix_analysis_documents_conversation_id"),
        "analysis_documents",
        ["conversation_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_analysis_documents_project_id"),
        "analysis_documents",
        ["project_id"],
        unique=False,
    )

    # Best-effort backfill for existing chat-derived analyses. Rows that cannot
    # be confidently matched by filename remain unlinked for later cleanup.
    op.execute(
        sa.text(
            """
            WITH matched AS (
                SELECT DISTINCT ON (ad.id)
                    ad.id AS analysis_document_id,
                    c.id AS conversation_id,
                    c.project_id AS project_id,
                    c.organization_id AS organization_id
                FROM analysis_documents ad
                JOIN conversations c
                    ON c.user_id = ad.user_id
                LEFT JOIN messages m
                    ON m.conversation_id = c.id
                WHERE ad.conversation_id IS NULL
                    AND (
                        (
                            m.attached_filename IS NOT NULL
                            AND EXISTS (
                                SELECT 1
                                FROM unnest(string_to_array(m.attached_filename, ',')) AS attached_name
                                WHERE lower(btrim(attached_name)) = lower(ad.filename)
                            )
                        )
                        OR c.metadata ->> 'last_uploaded_filename' = ad.filename
                        OR EXISTS (
                            SELECT 1
                            FROM jsonb_array_elements(
                                COALESCE(c.metadata -> 'uploaded_files', '[]'::jsonb)
                            ) AS uploaded_file
                            WHERE uploaded_file ->> 'filename' = ad.filename
                        )
                    )
                ORDER BY
                    ad.id,
                    abs(extract(epoch from (ad.created_at - COALESCE(m.created_at, c.created_at))))
            )
            UPDATE analysis_documents ad
            SET
                conversation_id = matched.conversation_id,
                project_id = matched.project_id,
                organization_id = COALESCE(ad.organization_id, matched.organization_id)
            FROM matched
            WHERE ad.id = matched.analysis_document_id
            """
        )
    )

    op.create_foreign_key(
        "fk_analysis_documents_conversation_id",
        "analysis_documents",
        "conversations",
        ["conversation_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_analysis_documents_project_id",
        "analysis_documents",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_analysis_documents_project_id", "analysis_documents", type_="foreignkey")
    op.drop_constraint("fk_analysis_documents_conversation_id", "analysis_documents", type_="foreignkey")
    op.drop_index(op.f("ix_analysis_documents_project_id"), table_name="analysis_documents")
    op.drop_index(op.f("ix_analysis_documents_conversation_id"), table_name="analysis_documents")
    op.drop_column("analysis_documents", "project_id")
    op.drop_column("analysis_documents", "conversation_id")
