"""Shared slowapi rate limiter.

Defined in its own module (not ``app.main``) so the auth router can import the
``limiter`` instance for its ``@limiter.limit(...)`` decorators without creating
a ``main`` <-> ``auth`` circular import (``main`` imports the auth router).

Disabled in tests via ``conftest.py`` (``limiter.enabled = False``).
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

limiter = Limiter(key_func=get_remote_address, enabled=settings.RATE_LIMIT_ENABLED)
