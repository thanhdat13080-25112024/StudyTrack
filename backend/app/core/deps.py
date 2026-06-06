"""FastAPI dependencies: DB session and current-user resolution.

``get_current_user`` is a Phase 0 STUB — it always raises 401. The real
implementation (decode JWT, load the User from the DB) arrives in Phase 1 once
the User model and auth router exist.
"""

from __future__ import annotations

from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.db import SessionLocal

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
):
    """STUB (Phase 0). Real auth lands in Phase 1.

    Once the User model exists this will decode the JWT via
    ``security.decode_access_token`` and return the matching User row.
    """
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication not implemented yet (Phase 0 stub).",
        headers={"WWW-Authenticate": "Bearer"},
    )
