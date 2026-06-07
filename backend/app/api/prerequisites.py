"""Prerequisite CRUD router (scoped to the current user)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.course import Course
from app.models.prerequisite import Prerequisite
from app.models.user import User
from app.schemas.prerequisite import PrerequisiteCreate, PrerequisiteOut

router = APIRouter()


def _out(p: Prerequisite) -> PrerequisiteOut:
    return PrerequisiteOut(
        id=p.id,
        course_id=p.course_id,
        prereq_course_id=p.prereq_course_id,
        course_code=p.course.code,
        prereq_code=p.prereq_course.code,
    )


@router.get("", response_model=list[PrerequisiteOut])
def list_prerequisites(
    course_id: int | None = Query(default=None),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PrerequisiteOut]:
    stmt = select(Prerequisite).where(Prerequisite.user_id == current.id)
    if course_id is not None:
        stmt = stmt.where(Prerequisite.course_id == course_id)
    return [_out(p) for p in db.scalars(stmt)]


@router.post("", response_model=PrerequisiteOut, status_code=status.HTTP_201_CREATED)
def create_prerequisite(
    data: PrerequisiteCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PrerequisiteOut:
    if data.course_id == data.prereq_course_id:
        raise HTTPException(status_code=422, detail="A course cannot be its own prerequisite")
    owned = set(
        db.scalars(
            select(Course.id).where(
                Course.user_id == current.id,
                Course.id.in_([data.course_id, data.prereq_course_id]),
            )
        )
    )
    if data.course_id not in owned or data.prereq_course_id not in owned:
        raise HTTPException(status_code=404, detail="Course not found")
    dup = db.scalar(
        select(Prerequisite).where(
            Prerequisite.user_id == current.id,
            Prerequisite.course_id == data.course_id,
            Prerequisite.prereq_course_id == data.prereq_course_id,
        )
    )
    if dup is not None:
        raise HTTPException(status_code=409, detail="Prerequisite already exists")
    obj = Prerequisite(user_id=current.id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return _out(obj)


@router.delete("/{prereq_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prerequisite(
    prereq_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    obj = db.scalar(
        select(Prerequisite).where(Prerequisite.id == prereq_id, Prerequisite.user_id == current.id)
    )
    if obj is None:
        raise HTTPException(status_code=404, detail="Prerequisite not found")
    db.delete(obj)
    db.commit()
