"""GPA summary + what-if router. Assembles ORM grades into engine GradeRows."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.grade import Grade
from app.models.user import User
from app.schemas.gpa import (
    GoalSeekOut,
    GpaSummaryOut,
    ProjectionOut,
    WhatIfIn,
    WhatIfOut,
)
from app.services import gpa_engine

router = APIRouter()


def _rows(db: Session, user: User) -> list[gpa_engine.GradeRow]:
    grades = db.scalars(select(Grade).where(Grade.user_id == user.id))
    return [
        gpa_engine.GradeRow(
            course_id=g.course_id,
            semester_id=g.semester_id,
            semester_code=g.semester.code,
            credits=g.course.credits,
            grade_10=g.grade_10,
            status=g.status,
        )
        for g in grades
    ]


@router.get("", response_model=GpaSummaryOut)
def get_gpa(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    total_required = current.profile.total_credits_required if current.profile else None
    return gpa_engine.gpa_summary(_rows(db, current), total_required)


@router.post("/what-if", response_model=WhatIfOut)
def what_if(
    data: WhatIfIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WhatIfOut:
    rows = _rows(db, current)
    cpa_info = gpa_engine.cumulative_cpa(rows)
    profile = current.profile
    target = (
        data.target_cpa
        if data.target_cpa is not None
        else (profile.target_cpa if profile else None)
    )
    total = (
        data.total_credits_required
        if data.total_credits_required is not None
        else (profile.total_credits_required if profile else None)
    )

    goal = None
    if target is not None:
        goal = GoalSeekOut(
            **gpa_engine.goal_seek(cpa_info["cpa"], cpa_info["credits"], target, total)
        )

    projection = None
    if data.hypotheticals:
        projection = ProjectionOut(
            **gpa_engine.project(
                cpa_info["cpa"],
                cpa_info["credits"],
                [h.model_dump() for h in data.hypotheticals],
            )
        )

    return WhatIfOut(goal_seek=goal, projection=projection)
