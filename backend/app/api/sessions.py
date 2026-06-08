"""Study-session router: create, list, delete (scoped to the current user)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.course import Course
from app.models.study_session import StudySession
from app.models.user import User
from app.schemas.study_session import StudySessionCreate, StudySessionOut

router = APIRouter()


@router.post("", response_model=StudySessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    data: StudySessionCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudySession:
    if data.course_id is not None:
        owned = db.scalar(
            select(Course.id).where(Course.id == data.course_id, Course.user_id == current.id)
        )
        if owned is None:
            raise HTTPException(status_code=422, detail="course_id not found")
    session = StudySession(user_id=current.id, **data.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=list[StudySessionOut])
def list_sessions(
    limit: int | None = Query(default=None, ge=1, le=500),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[StudySession]:
    stmt = (
        select(StudySession)
        .where(StudySession.user_id == current.id)
        .order_by(StudySession.session_date.desc(), StudySession.id.desc())
    )
    if limit:
        stmt = stmt.limit(limit)
    return list(db.scalars(stmt))


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    session = db.scalar(
        select(StudySession).where(
            StudySession.id == session_id, StudySession.user_id == current.id
        )
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    db.delete(session)
    db.commit()
