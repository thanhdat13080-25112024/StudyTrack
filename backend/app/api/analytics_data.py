"""Analytics router: computed study-habit metrics (all derived, nothing stored).

Named ``analytics_data.py`` to avoid collision with the existing
``analysis.py`` router (weak-subject / direction analysis).
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.study_session import StudySession
from app.models.user import User
from app.schemas.analytics import AnalyticsOut
from app.services import analytics as svc

router = APIRouter()


@router.get("", response_model=AnalyticsOut)
def get_analytics(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    stmt = select(StudySession).where(StudySession.user_id == current.id)
    if from_date is not None:
        stmt = stmt.where(StudySession.session_date >= from_date)
    if to_date is not None:
        stmt = stmt.where(StudySession.session_date <= to_date)
    sessions = list(db.scalars(stmt))
    today = date.today()
    heatmap_year = today.year

    return {
        "heatmap": svc.study_heatmap(sessions, heatmap_year),
        "time_by_method": svc.time_by_method(sessions),
        "time_by_course": svc.time_by_course(sessions),
        "focus_trend": svc.focus_trend(sessions),
        "weekly_comparison": svc.weekly_comparison(sessions, today),
        "monthly_comparison": svc.monthly_comparison(sessions, today),
        "productivity_score": svc.productivity_score(sessions, today),
        "hourly_distribution": svc.hourly_distribution(sessions),
        "method_effectiveness": svc.method_effectiveness(sessions),
    }
