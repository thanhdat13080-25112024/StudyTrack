"""auth lifecycle: email_verified + auth_tokens

Revision ID: 0006_auth_lifecycle
Revises: 0005_deadlines_notifications
Create Date: 2026-06-08

Note: revision id kept <= 32 chars (Postgres alembic_version.version_num is
VARCHAR(32)).
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0006_auth_lifecycle"
down_revision = "0005_deadlines_notifications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "users",
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "auth_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_auth_tokens_user_id", "auth_tokens", ["user_id"])
    op.create_index("ix_auth_tokens_user_type", "auth_tokens", ["user_id", "type"])


def downgrade() -> None:
    op.drop_index("ix_auth_tokens_user_type", table_name="auth_tokens")
    op.drop_index("ix_auth_tokens_user_id", table_name="auth_tokens")
    op.drop_table("auth_tokens")
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "email_verified")
