"""Deadlines router: CRUD scoped to the current user. Editing `course_id`
requires the course to belong to the user (422 otherwise)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.course import Course
from app.models.deadline import Deadline
from app.models.user import User
from app.schemas.deadline import DeadlineCreate, DeadlineOut, DeadlineUpdate

router = APIRouter()


def _assert_course_owned(db: Session, user_id: int, course_id: int | None) -> None:
    if course_id is None:
        return
    owned = db.scalar(select(Course.id).where(Course.id == course_id, Course.user_id == user_id))
    if owned is None:
        raise HTTPException(status_code=422, detail="course_id not found")


@router.post("", response_model=DeadlineOut, status_code=status.HTTP_201_CREATED)
def create_deadline(
    data: DeadlineCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Deadline:
    _assert_course_owned(db, current.id, data.course_id)
    deadline = Deadline(user_id=current.id, **data.model_dump())
    db.add(deadline)
    db.commit()
    db.refresh(deadline)
    return deadline


@router.get("", response_model=list[DeadlineOut])
def list_deadlines(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Deadline]:
    stmt = (
        select(Deadline)
        .where(Deadline.user_id == current.id)
        .order_by(Deadline.done.asc(), Deadline.due_at.asc(), Deadline.id.asc())
    )
    return list(db.scalars(stmt))


def _get_owned(db: Session, user_id: int, deadline_id: int) -> Deadline:
    deadline = db.scalar(
        select(Deadline).where(Deadline.id == deadline_id, Deadline.user_id == user_id)
    )
    if deadline is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deadline not found")
    return deadline


@router.put("/{deadline_id}", response_model=DeadlineOut)
def update_deadline(
    deadline_id: int,
    data: DeadlineUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Deadline:
    deadline = _get_owned(db, current.id, deadline_id)
    fields = data.model_dump(exclude_unset=True)
    if "course_id" in fields:
        _assert_course_owned(db, current.id, fields["course_id"])
    for key, value in fields.items():
        setattr(deadline, key, value)
    db.commit()
    db.refresh(deadline)
    return deadline


@router.delete("/{deadline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deadline(
    deadline_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    deadline = _get_owned(db, current.id, deadline_id)
    db.delete(deadline)
    db.commit()
