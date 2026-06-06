"""FastAPI application entrypoint.

Phase 0 skeleton: boots, applies CORS from settings, and exposes the health
router under ``/api``. Domain routers (auth, profile, sessions, schedule,
courses, semesters, grades, gpa, roadmap, analysis, deadlines, notifications,
dashboard) and the WebSocket mount are added in later phases.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, health
from app.core.config import settings

app = FastAPI(
    title="StudyTrack API",
    version="0.1.0",
    description="Backend for the StudyTrack full-stack refactor.",
)

# --- CORS -------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ----------------------------------------------------------------
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# Future domain routers (Phases 1-6) are mounted here, e.g.:
# app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

# --- WebSocket mount point (Phase 5) ----------------------------------------
# Real-time notifications/deadlines will be served at ``/ws``. Wire it here:
#     from app.api import ws
#     app.include_router(ws.router)  # ws.router defines @router.websocket("/ws")
# Left intentionally unmounted in Phase 0.
