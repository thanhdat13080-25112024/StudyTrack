"""FastAPI application entrypoint.

Phase 0 skeleton: boots, applies CORS from settings, and exposes the health
router under ``/api``. Domain routers (auth, profile, sessions, schedule,
courses, semesters, grades, gpa, roadmap, analysis, deadlines, notifications,
dashboard) and the WebSocket mount are added in later phases.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    auth,
    courses,
    dashboard,
    gpa,
    grades,
    health,
    prerequisites,
    profile,
    roadmap,
    schedule,
    semesters,
    sessions,
    suggestions,
)
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
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["schedule"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(suggestions.router, prefix="/api/suggestions", tags=["suggestions"])
app.include_router(semesters.router, prefix="/api/semesters", tags=["semesters"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(grades.router, prefix="/api/grades", tags=["grades"])
app.include_router(gpa.router, prefix="/api/gpa", tags=["gpa"])
app.include_router(prerequisites.router, prefix="/api/prerequisites", tags=["prerequisites"])
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["roadmap"])

# --- WebSocket mount point (Phase 5) ----------------------------------------
# Real-time notifications/deadlines will be served at ``/ws``. Wire it here:
#     from app.api import ws
#     app.include_router(ws.router)  # ws.router defines @router.websocket("/ws")
# Left intentionally unmounted in Phase 0.
