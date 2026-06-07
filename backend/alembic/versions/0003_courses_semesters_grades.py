"""courses, semesters, grades

Revision ID: 0003_courses_semesters_grades
Revises: 0002_study_sessions_schedule
Create Date: 2026-06-07
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003_courses_semesters_grades"
down_revision = "0002_study_sessions_schedule"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "semesters",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "code", name="uq_semester_user_code"),
    )
    op.create_index(op.f("ix_semesters_user_id"), "semesters", ["user_id"])

    op.create_table(
        "courses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("credits", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=20), nullable=True),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default="1"),
        sa.Column("planned_semester_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["planned_semester_id"], ["semesters.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("user_id", "code", name="uq_course_user_code"),
    )
    op.create_index(op.f("ix_courses_user_id"), "courses", ["user_id"])

    op.create_table(
        "grades",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("semester_id", sa.Integer(), nullable=False),
        sa.Column("grade_10", sa.Float(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["semester_id"], ["semesters.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "course_id", "semester_id", name="uq_grade_user_course_sem"),
    )
    op.create_index(op.f("ix_grades_user_id"), "grades", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_grades_user_id"), table_name="grades")
    op.drop_table("grades")
    op.drop_index(op.f("ix_courses_user_id"), table_name="courses")
    op.drop_table("courses")
    op.drop_index(op.f("ix_semesters_user_id"), table_name="semesters")
    op.drop_table("semesters")
