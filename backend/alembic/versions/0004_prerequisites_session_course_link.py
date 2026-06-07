"""prerequisites, study_sessions.course_id FK, profiles.max_credits_per_semester

Revision ID: 0004_prerequisites_session_course_link
Revises: 0003_courses_semesters_grades
Create Date: 2026-06-07
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0004_prerequisites_session_course_link"
down_revision = "0003_courses_semesters_grades"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "prerequisites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("prereq_course_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["prereq_course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.UniqueConstraint(
            "user_id", "course_id", "prereq_course_id", name="uq_prereq_user_course_prereq"
        ),
    )
    op.create_index(op.f("ix_prerequisites_user_id"), "prerequisites", ["user_id"])

    op.add_column("profiles", sa.Column("max_credits_per_semester", sa.Integer(), nullable=True))

    with op.batch_alter_table("study_sessions") as batch:
        batch.create_foreign_key(
            "fk_study_sessions_course_id",
            "courses",
            ["course_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("study_sessions") as batch:
        batch.drop_constraint("fk_study_sessions_course_id", type_="foreignkey")
    op.drop_column("profiles", "max_credits_per_semester")
    op.drop_index(op.f("ix_prerequisites_user_id"), table_name="prerequisites")
    op.drop_table("prerequisites")
