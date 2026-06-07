"""Roadmap router — generate (stateless) and apply (persist planned_semester_id
+ upsert future semesters). Deterministic: apply re-runs the engine."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.course import Course
from app.models.grade import Grade
from app.models.prerequisite import Prerequisite
from app.models.semester import Semester
from app.models.user import User
from app.schemas.roadmap import RoadmapIn, RoadmapOut
from app.services import roadmap_engine

router = APIRouter()

DEFAULT_CAP = 24
_DONE = {"passed", "exempt"}


def _latest_status_by_course(db: Session, user: User) -> dict[int, str]:
    """Latest grade status per course, by max semester code."""
    best: dict[int, tuple[str, str]] = {}  # course_id -> (semester_code, status)
    for g in db.scalars(select(Grade).where(Grade.user_id == user.id)):
        code = g.semester.code
        cur = best.get(g.course_id)
        if cur is None or code > cur[0]:
            best[g.course_id] = (code, g.status)
    return {cid: st for cid, (_, st) in best.items()}


def _latest_graded_semester_code(db: Session, user: User) -> str | None:
    codes = [g.semester.code for g in db.scalars(select(Grade).where(Grade.user_id == user.id))]
    return max(codes) if codes else None


def _build_plan(db: Session, user: User, data: RoadmapIn, persist: bool) -> dict:
    courses = list(db.scalars(select(Course).where(Course.user_id == user.id)))
    status_by_course = _latest_status_by_course(db, user)

    remaining = [
        roadmap_engine.RoadmapCourse(
            course_id=c.id,
            code=c.code,
            name=c.name,
            credits=c.credits,
            is_required=c.is_required,
        )
        for c in courses
        if status_by_course.get(c.id) not in _DONE and status_by_course.get(c.id) != "in_progress"
    ]
    remaining_ids = {c.course_id for c in remaining}
    edges = [
        (p.course_id, p.prereq_course_id)
        for p in db.scalars(select(Prerequisite).where(Prerequisite.user_id == user.id))
    ]

    profile = user.profile
    cap = (
        data.max_credits_per_semester
        or (profile.max_credits_per_semester if profile else None)
        or DEFAULT_CAP
    )
    if data.start_code:
        start_code = data.start_code
    else:
        latest = _latest_graded_semester_code(db, user)
        start_code = (
            roadmap_engine.next_semester_code(latest) if latest else f"{date.today().year}-1"
        )
    expected = profile.expected_graduation if profile else None

    plan = roadmap_engine.generate_roadmap(
        remaining, edges, credits_cap=cap, start_code=start_code, expected_graduation=expected
    )

    if persist:
        # clear stale assignments on remaining courses, then re-assign
        for c in courses:
            if c.id in remaining_ids:
                c.planned_semester_id = None
        sem_by_code = {
            s.code: s for s in db.scalars(select(Semester).where(Semester.user_id == user.id))
        }
        course_by_id = {c.id: c for c in courses}
        for sem in plan["semesters"]:
            target = sem_by_code.get(sem["code"])
            if target is None:
                target = Semester(user_id=user.id, code=sem["code"])
                db.add(target)
                db.flush()  # assign target.id
                sem_by_code[sem["code"]] = target
            for sc in sem["courses"]:
                course_by_id[sc["course_id"]].planned_semester_id = target.id
        db.commit()

    return plan


@router.post("/generate", response_model=RoadmapOut)
def generate(
    data: RoadmapIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return _build_plan(db, current, data, persist=False)


@router.post("/apply", response_model=RoadmapOut)
def apply(
    data: RoadmapIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    return _build_plan(db, current, data, persist=True)
