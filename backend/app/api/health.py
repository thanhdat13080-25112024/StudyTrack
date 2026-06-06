"""Health-check router.

Liveness probe used by Docker/compose, CI smoke tests, and the Phase 0 pytest.
Intentionally has no DB dependency so it answers even with no database.
"""

from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Return service liveness. Contract: ``{"status": "ok"}``."""
    return {"status": "ok"}
