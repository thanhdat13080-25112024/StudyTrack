"""Profile model — 1:1 with User. Identity fields used now; academic fields
(nullable) reserved for Phase 3. Plan abbreviates the column as `class`, but
that is a Python keyword, so the attribute/JSON field is `class_name`."""

from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Identity (surfaced in the Phase 1 UI)
    class_name: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    faculty: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    major: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    goal: Mapped[str] = mapped_column(Text, default="", nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # base64 data-URI

    # Academic (nullable, unused until Phase 3)
    target_cpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_credits_required: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_graduation: Mapped[str | None] = mapped_column(String(32), nullable=True)

    user: Mapped["User"] = relationship(back_populates="profile")
