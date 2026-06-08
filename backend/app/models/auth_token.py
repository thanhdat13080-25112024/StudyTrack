"""AuthToken model — single-use, expiring tokens for the two email flows
(email_verify, password_reset). Only a sha256 HASH of the raw token is stored;
the raw token is e-mailed once and never persisted."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.models.user import User


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)  # email_verify / password_reset
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # sha256 hexdigest
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="auth_tokens")

    __table_args__ = (Index("ix_auth_tokens_user_type", "user_id", "type"),)
