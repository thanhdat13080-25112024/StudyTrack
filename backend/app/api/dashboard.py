"""Dashboard router: aggregate KPIs + 7-day chart + badges + recent sessions."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.study_session import StudySession
from app.models.user import User
from app.schemas.dashboard import DashboardOut
from app.services import dashboard as dash

router = APIRouter()

RECENT_LIMIT = 5


@router.get("", response_model=DashboardOut)
def get_dashboard(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    sessions = list(db.scalars(select(StudySession).where(StudySession.user_id == current.id)))
    today = date.today()
    recent = sorted(sessions, key=lambda s: (s.session_date, s.id), reverse=True)[:RECENT_LIMIT]
    return {
        "kpis": dash.kpis(sessions, today),
        "chart": dash.seven_day_buckets(sessions, today),
        "badges": dash.badges(sessions),
        "recent_sessions": recent,
    }
