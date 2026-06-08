"""Auth-token service: random single-use tokens for email verify / password reset.

Only a sha256 HASH of the raw token is stored. The hash is deterministic so a
presented raw token can be looked up — safe because tokens are high-entropy
random (unlike passwords, which use argon2 + salt and are verified, not looked up).
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.auth_token import AuthToken
from app.models.user import User


def generate_raw_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _as_utc(dt: datetime) -> datetime:
    """SQLite returns tz-naive datetimes; treat them as UTC for comparison."""
    from datetime import UTC

    return dt if dt.tzinfo is not None else dt.replace(tzinfo=UTC)


def issue_token(db: Session, user: User, type: str, ttl: timedelta) -> str:
    """Create a token row, return the raw token ONCE (only its hash is stored)."""
    from datetime import UTC

    raw = generate_raw_token()
    db.add(
        AuthToken(
            user_id=user.id,
            type=type,
            token_hash=hash_token(raw),
            expires_at=datetime.now(UTC) + ttl,
        )
    )
    db.commit()
    return raw


def verify_token(db: Session, raw: str, type: str, now: datetime) -> AuthToken | None:
    """Return the matching unused, unexpired token of `type`, else None."""
    token = db.scalar(
        select(AuthToken).where(AuthToken.token_hash == hash_token(raw), AuthToken.type == type)
    )
    if token is None or token.used_at is not None:
        return None
    if _as_utc(token.expires_at) < now:
        return None
    return token


def consume_token(db: Session, token: AuthToken) -> None:
    from datetime import UTC

    token.used_at = datetime.now(UTC)
    db.commit()
