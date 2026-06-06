"""user and profile

Revision ID: 0001_user_profile
Revises:
Create Date: 2026-06-06
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0001_user_profile"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("lang", sa.String(length=8), nullable=False, server_default="vi"),
        sa.Column("theme", sa.String(length=8), nullable=False, server_default="dark"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("class_name", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("faculty", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("major", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("goal", sa.Text(), nullable=False, server_default=""),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("target_cpa", sa.Float(), nullable=True),
        sa.Column("total_credits_required", sa.Integer(), nullable=True),
        sa.Column("expected_graduation", sa.String(length=32), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("profiles")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
