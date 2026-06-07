"""Dashboard aggregate response."""

from __future__ import annotations

from pydantic import BaseModel

from app.schemas.study_session import StudySessionOut


class KpiOut(BaseModel):
    today_minutes: int
    total_minutes: int
    total_sessions: int
    streak: int


class ChartPointOut(BaseModel):
    date: str  # YYYY-MM-DD
    minutes: int


class BadgeOut(BaseModel):
    key: str  # first_session | focused_5h | master_20h
    unlocked: bool


class DashboardOut(BaseModel):
    kpis: KpiOut
    chart: list[ChartPointOut]
    badges: list[BadgeOut]
    recent_sessions: list[StudySessionOut]
