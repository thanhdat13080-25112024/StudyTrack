"""FastAPI dependencies: DB session and current-user resolution.

``get_current_user`` is a Phase 0 STUB — it always raises 401. The real
implementation (decode JWT, load the User from the DB) arrives in Phase 1 once
the User model and auth router exist.
"""

from __future__ import annotations

from collections.abc import Generator
from typing import TYPE_CHECKING

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.db import SessionLocal

if TYPE_CHECKING:
    from app.models.user import User

# tokenUrl points at the (future) Phase 1 login endpoint.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_db() -> Generator[Session, None, None]:
    """Yield a SQLAlchemy session and guarantee it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode the bearer JWT and return the matching User, or 401."""
    from sqlalchemy import select

    from app.core.security import decode_access_token, token_predates_password_change
    from app.models.user import User

    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error
    payload = decode_access_token(token)
    if not payload:
        raise credentials_error
    email = payload.get("sub")
    if not email:
        raise credentials_error
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        raise credentials_error
    if token_predates_password_change(payload, user.password_changed_at):
        raise credentials_error  # token minted before the last password change
    return user
