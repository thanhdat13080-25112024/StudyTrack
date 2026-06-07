"""Semester CRUD router (scoped to the current user)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.semester import Semester
from app.models.user import User
from app.schemas.semester import SemesterCreate, SemesterOut, SemesterUpdate

router = APIRouter()


def _get_owned(db: Session, user: User, semester_id: int) -> Semester:
    obj = db.scalar(select(Semester).where(Semester.id == semester_id, Semester.user_id == user.id))
    if obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")
    return obj


@router.get("", response_model=list[SemesterOut])
def list_semesters(
    current: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[Semester]:
    return list(
        db.scalars(select(Semester).where(Semester.user_id == current.id).order_by(Semester.code))
    )


@router.post("", response_model=SemesterOut, status_code=status.HTTP_201_CREATED)
def create_semester(
    data: SemesterCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Semester:
    obj = Semester(user_id=current.id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.put("/{semester_id}", response_model=SemesterOut)
def update_semester(
    semester_id: int,
    data: SemesterUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Semester:
    obj = _get_owned(db, current, semester_id)
    for k, v in data.model_dump().items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{semester_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_semester(
    semester_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    db.delete(_get_owned(db, current, semester_id))
    db.commit()
