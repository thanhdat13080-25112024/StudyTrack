"""Dashboard aggregation — KPIs, 7-day buckets, derived badges.

Operates on any object exposing `.actual_minutes: int` and `.session_date: date`
(StudySession rows). Badge thresholds match legacy updateBadgeUI: >=1 session,
>=5h (300 min), >=20h (1200 min) of actual study time."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Protocol

from app.services.streak import compute_streak

BADGE_FOCUSED_MIN = 300
BADGE_MASTER_MIN = 1200


class _Row(Protocol):
    actual_minutes: int
    session_date: date


def kpis(sessions: list[_Row], today: date) -> dict[str, int]:
    return {
        "today_minutes": sum(s.actual_minutes for s in sessions if s.session_date == today),
        "total_minutes": sum(s.actual_minutes for s in sessions),
        "total_sessions": len(sessions),
        "streak": compute_streak([s.session_date for s in sessions], today),
    }


def seven_day_buckets(sessions: list[_Row], today: date) -> list[dict]:
    days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    totals: dict[date, int] = {d: 0 for d in days}
    for s in sessions:
        if s.session_date in totals:
            totals[s.session_date] += s.actual_minutes
    return [{"date": d.isoformat(), "minutes": totals[d]} for d in days]


def badges(sessions: list[_Row]) -> list[dict]:
    total = sum(s.actual_minutes for s in sessions)
    return [
        {"key": "first_session", "unlocked": len(sessions) >= 1},
        {"key": "focused_5h", "unlocked": total >= BADGE_FOCUSED_MIN},
        {"key": "master_20h", "unlocked": total >= BADGE_MASTER_MIN},
    ]
