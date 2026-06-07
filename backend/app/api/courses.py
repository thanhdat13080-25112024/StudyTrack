"""Course CRUD router (scoped to the current user)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.course import Course
from app.models.user import User
from app.schemas.course import CourseCreate, CourseOut, CourseUpdate

router = APIRouter()


def _get_owned(db: Session, user: User, course_id: int) -> Course:
    obj = db.scalar(select(Course).where(Course.id == course_id, Course.user_id == user.id))
    if obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return obj


@router.get("", response_model=list[CourseOut])
def list_courses(
    current: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[Course]:
    return list(
        db.scalars(select(Course).where(Course.user_id == current.id).order_by(Course.code))
    )


@router.post("", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def create_course(
    data: CourseCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Course:
    obj = Course(user_id=current.id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    data: CourseUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Course:
    obj = _get_owned(db, current, course_id)
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    db.delete(_get_owned(db, current, course_id))
    db.commit()
