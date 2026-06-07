"""Grade CRUD router. Responses embed minimal course/semester summaries and the
engine-computed letter/grade_4 (not stored)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.course import Course
from app.models.grade import Grade
from app.models.semester import Semester
from app.models.user import User
from app.schemas.grade import (
    CourseSummary,
    GradeCreate,
    GradeOut,
    GradeUpdate,
    SemesterSummary,
)
from app.services.gpa_engine import grade_to_grade4, grade_to_letter

router = APIRouter()


def _to_out(g: Grade) -> GradeOut:
    letter = grade_to_letter(g.grade_10) if g.grade_10 is not None else None
    grade_4 = grade_to_grade4(g.grade_10) if g.grade_10 is not None else None
    return GradeOut(
        id=g.id,
        course_id=g.course_id,
        semester_id=g.semester_id,
        grade_10=g.grade_10,
        status=g.status,
        letter=letter,
        grade_4=grade_4,
        course=CourseSummary.model_validate(g.course),
        semester=SemesterSummary.model_validate(g.semester),
    )


def _validate_refs(db: Session, user: User, course_id: int, semester_id: int) -> None:
    if not db.scalar(select(Course).where(Course.id == course_id, Course.user_id == user.id)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if not db.scalar(
        select(Semester).where(Semester.id == semester_id, Semester.user_id == user.id)
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")


def _get_owned(db: Session, user: User, grade_id: int) -> Grade:
    obj = db.scalar(select(Grade).where(Grade.id == grade_id, Grade.user_id == user.id))
    if obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade not found")
    return obj


@router.get("", response_model=list[GradeOut])
def list_grades(
    semester_id: int | None = Query(default=None),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[GradeOut]:
    stmt = select(Grade).where(Grade.user_id == current.id)
    if semester_id is not None:
        stmt = stmt.where(Grade.semester_id == semester_id)
    return [_to_out(g) for g in db.scalars(stmt.order_by(Grade.id))]


@router.post("", response_model=GradeOut, status_code=status.HTTP_201_CREATED)
def create_grade(
    data: GradeCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GradeOut:
    _validate_refs(db, current, data.course_id, data.semester_id)
    obj = Grade(user_id=current.id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _to_out(obj)


@router.put("/{grade_id}", response_model=GradeOut)
def update_grade(
    grade_id: int,
    data: GradeUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GradeOut:
    obj = _get_owned(db, current, grade_id)
    _validate_refs(db, current, data.course_id, data.semester_id)
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return _to_out(obj)


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade(
    grade_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    db.delete(_get_owned(db, current, grade_id))
    db.commit()
