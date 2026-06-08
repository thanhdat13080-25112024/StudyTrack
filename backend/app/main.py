"""FastAPI application entrypoint.

Phase 0 skeleton: boots, applies CORS from settings, and exposes the health
router under ``/api``. Domain routers (auth, profile, sessions, schedule,
courses, semesters, grades, gpa, roadmap, analysis, deadlines, notifications,
dashboard) and the WebSocket mount are added in later phases.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    analysis,
    auth,
    courses,
    dashboard,
    deadlines,
    gpa,
    grades,
    health,
    notifications,
    prerequisites,
    profile,
    roadmap,
    schedule,
    semesters,
    sessions,
    suggestions,
    ws,
)
from app.core.config import settings
from app.realtime.manager import manager
from app.realtime.scanner import reminder_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    manager.set_loop(asyncio.get_running_loop())
    stop = asyncio.Event()
    task = asyncio.create_task(reminder_loop(stop))
    try:
        yield
    finally:
        stop.set()
        task.cancel()
        try:
            await task
        except (asyncio.CancelledError, Exception):
            pass


app = FastAPI(
    title="StudyTrack API",
    version="0.1.0",
    description="Backend for the StudyTrack full-stack refactor.",
    lifespan=lifespan,
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
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(deadlines.router, prefix="/api/deadlines", tags=["deadlines"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])

# --- WebSocket --------------------------------------------------------------
# Real-time notifications served at ``/ws/notifications`` (token-in-query auth).
app.include_router(ws.router)
