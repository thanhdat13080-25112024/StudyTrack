"""deadlines + notifications

Revision ID: 0005_deadlines_notifications
Revises: 0004_prereqs_session_course
Create Date: 2026-06-08

Note: revision id kept <= 32 chars (Postgres alembic_version.version_num is
VARCHAR(32)).
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0005_deadlines_notifications"
down_revision = "0004_prereqs_session_course"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "deadlines",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("type", sa.String(length=20), nullable=False),
        sa.Column("due_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("done", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("priority", sa.String(length=10), nullable=False, server_default="medium"),
        sa.Column("remind_before_minutes", sa.Integer(), nullable=True),
        sa.Column("reminded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_deadlines_user_id", "deadlines", ["user_id"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_notifications_user_id", table_name="notifications")
    op.drop_table("notifications")
    op.drop_index("ix_deadlines_user_id", table_name="deadlines")
    op.drop_table("deadlines")
