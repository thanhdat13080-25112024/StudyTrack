"""Grade model — a user's enrollment+grade for a course in a semester.
An `in_progress`/`exempt` row has a null `grade_10`. `grade_letter`/`grade_4`
are NOT stored — computed on read by `services.gpa_engine`."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.semester import Semester
    from app.models.user import User


class Grade(Base):
    __tablename__ = "grades"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", "semester_id", name="uq_grade_user_course_sem"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    semester_id: Mapped[int] = mapped_column(
        ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False
    )
    grade_10: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    course: Mapped[Course] = relationship()
    semester: Mapped[Semester] = relationship()
    user: Mapped[User] = relationship(back_populates="grades")
