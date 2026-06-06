"""Password hashing (argon2) and JWT encode/decode helpers.

Argon2 via passlib replaces the legacy app's plaintext passwords — this is the
explicit security fix of the refactor. Secrets come from ``settings``, never
from code literals.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Argon2 is the only scheme; deprecated="auto" lets us migrate hashes later.
_pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# --- Password hashing -------------------------------------------------------
def hash_password(password: str) -> str:
    """Return an argon2 hash of ``password``."""
    return _pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if ``plain_password`` matches the stored argon2 ``hashed_password``."""
    return _pwd_context.verify(plain_password, hashed_password)


# --- JWT --------------------------------------------------------------------
def create_access_token(
    subject: str,
    *,
    expires_delta: timedelta | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Create a signed JWT access token whose ``sub`` is ``subject`` (e.g. user email)."""
    expire = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Decode/verify a JWT. Returns the claims dict, or ``None`` if invalid/expired."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
    except JWTError:
        return None
