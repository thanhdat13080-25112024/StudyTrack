"""Analysis router — assembles ORM data into weak_subject + direction_analysis
service inputs."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.course import Course
from app.models.grade import Grade
from app.models.prerequisite import Prerequisite
from app.models.semester import Semester
from app.models.study_session import StudySession
from app.models.user import User
from app.schemas.analysis import DirectionOut, WeakSubjectOut
from app.services import direction_analysis, gpa_engine, weak_subject

router = APIRouter()

DEFAULT_CAP = 24
_DONE = {"passed", "exempt"}


def _latest_grade_by_course(db: Session, user: User) -> dict[int, Grade]:
    best: dict[int, Grade] = {}
    for g in db.scalars(select(Grade).where(Grade.user_id == user.id)):
        cur = best.get(g.course_id)
        if cur is None or g.semester.code > cur.semester.code:
            best[g.course_id] = g
    return best


def _linked_minutes(db: Session, user: User) -> dict[int, int]:
    mins: dict[int, int] = {}
    for s in db.scalars(select(StudySession).where(StudySession.user_id == user.id)):
        if s.course_id is not None:
            mins[s.course_id] = mins.get(s.course_id, 0) + s.actual_minutes
    return mins


def _grade4(g: Grade | None) -> float | None:
    if g is not None and g.status in ("passed", "failed") and g.grade_10 is not None:
        return gpa_engine.grade_to_grade4(g.grade_10)
    return None


@router.get("/weak-subjects", response_model=list[WeakSubjectOut])
def weak_subjects(
    current: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[dict]:
    courses = {c.id: c for c in db.scalars(select(Course).where(Course.user_id == current.id))}
    latest = _latest_grade_by_course(db, current)
    minutes = _linked_minutes(db, current)
    edges = list(db.scalars(select(Prerequisite).where(Prerequisite.user_id == current.id)))
    status_by_course = {cid: g.status for cid, g in latest.items()}

    def prereq_ok(course_id: int) -> bool:
        for p in edges:
            if p.course_id == course_id and status_by_course.get(p.prereq_course_id) not in _DONE:
                return False
        return True

    rows = []
    for cid, c in courses.items():
        g = latest.get(cid)
        status = g.status if g else "in_progress"
        rows.append(
            weak_subject.WeakInput(
                course_id=cid,
                code=c.code,
                name=c.name,
                credits=c.credits,
                status=status,
                grade_4=_grade4(g),
                linked_minutes=minutes.get(cid, 0),
                prereq_satisfied=prereq_ok(cid),
            )
        )
    return weak_subject.detect_weak_subjects(rows)


@router.get("/direction", response_model=DirectionOut)
def direction(current: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    courses = list(db.scalars(select(Course).where(Course.user_id == current.id)))
    latest = _latest_grade_by_course(db, current)
    cap = (
        current.profile.max_credits_per_semester
        if current.profile and current.profile.max_credits_per_semester
        else DEFAULT_CAP
    )
    sem_code_by_id = {
        s.id: s.code for s in db.scalars(select(Semester).where(Semester.user_id == current.id))
    }
    dir_courses = []
    for c in courses:
        g = latest.get(c.id)
        if g is not None:
            code = g.semester.code
        elif c.planned_semester_id is not None:
            code = sem_code_by_id.get(c.planned_semester_id)
        else:
            code = None
        dir_courses.append(
            direction_analysis.DirCourse(
                course_id=c.id,
                category=c.category,
                credits=c.credits,
                grade_4=_grade4(g),
                semester_code=code,
            )
        )
    result = direction_analysis.analyze_direction(dir_courses, cap=cap)

    edges = [
        (p.course_id, p.prereq_course_id)
        for p in db.scalars(select(Prerequisite).where(Prerequisite.user_id == current.id))
    ]
    status_by_course = {cid: g.status for cid, g in latest.items()}
    active_ids = {
        c.id
        for c in courses
        if status_by_course.get(c.id) == "in_progress" or c.planned_semester_id is not None
    }
    result["missing_prerequisites"] = direction_analysis.find_missing_prerequisites(
        active_ids, status_by_course, edges, {c.id: c.code for c in courses}
    )
    return result
