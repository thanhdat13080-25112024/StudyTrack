"""study_sessions and schedule_items

Revision ID: 0002_study_sessions_schedule
Revises: 0001_user_profile
Create Date: 2026-06-07
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_study_sessions_schedule"
down_revision = "0001_user_profile"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "study_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=True),
        sa.Column("subject", sa.String(length=200), nullable=False),
        sa.Column("planned_minutes", sa.Integer(), nullable=False),
        sa.Column("actual_minutes", sa.Integer(), nullable=False),
        sa.Column("focus", sa.Integer(), nullable=False),
        sa.Column("method", sa.String(length=40), nullable=False),
        sa.Column("note", sa.Text(), nullable=False, server_default=""),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_study_sessions_user_id"), "study_sessions", ["user_id"])
    op.create_index(op.f("ix_study_sessions_session_date"), "study_sessions", ["session_date"])

    op.create_table(
        "schedule_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=True),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("time", sa.String(length=5), nullable=False),
        sa.Column("subject", sa.String(length=200), nullable=False),
        sa.Column("recurring", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_schedule_items_user_id"), "schedule_items", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_schedule_items_user_id"), table_name="schedule_items")
    op.drop_table("schedule_items")
    op.drop_index(op.f("ix_study_sessions_session_date"), table_name="study_sessions")
    op.drop_index(op.f("ix_study_sessions_user_id"), table_name="study_sessions")
    op.drop_table("study_sessions")
