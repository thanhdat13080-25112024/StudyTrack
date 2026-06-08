"""Prerequisite model — a self-M2M edge Course↔Course (course_id requires
prereq_course_id). Scoped to a user; both courses must belong to that user
(enforced in the router). Cycles are reported by roadmap_engine, not the DB."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.user import User


class Prerequisite(Base):
    __tablename__ = "prerequisites"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "course_id", "prereq_course_id", name="uq_prereq_user_course_prereq"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    prereq_course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    course: Mapped[Course] = relationship(foreign_keys=[course_id])
    prereq_course: Mapped[Course] = relationship(foreign_keys=[prereq_course_id])
    user: Mapped[User] = relationship()
