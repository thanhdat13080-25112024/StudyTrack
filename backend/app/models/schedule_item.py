"""ScheduleItem model — a recurring weekly study-calendar entry (port of legacy
schedules). `day_of_week` is 0-6 (Mon=0); `time` is "HH:MM" 24h. `course_id` is
nullable, no FK yet (Phase 4)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.models.user import User


class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    course_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # FK in Phase 4
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Mon .. 6=Sun
    time: Mapped[str] = mapped_column(String(5), nullable=False)  # "HH:MM"
    subject: Mapped[str] = mapped_column(String(200), nullable=False)
    recurring: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="schedule_items")
