"""Notifications router: list (newest-first, optional unread-only), mark one
read, mark all read, unread count. Scoped to the current user."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationOut, UnreadCountOut

router = APIRouter()


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    unread_only: bool = Query(default=False),
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Notification]:
    stmt = select(Notification).where(Notification.user_id == current.id)
    if unread_only:
        stmt = stmt.where(Notification.read.is_(False))
    stmt = stmt.order_by(Notification.created_at.desc(), Notification.id.desc())
    return list(db.scalars(stmt))


@router.get("/unread-count", response_model=UnreadCountOut)
def unread_count(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UnreadCountOut:
    count = db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == current.id, Notification.read.is_(False))
    )
    return UnreadCountOut(count=int(count or 0))


@router.post("/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(
    notification_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    notif = db.scalar(
        select(Notification).where(
            Notification.id == notification_id, Notification.user_id == current.id
        )
    )
    if notif is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.read = True
    db.commit()


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def read_all(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    db.execute(
        update(Notification)
        .where(Notification.user_id == current.id, Notification.read.is_(False))
        .values(read=True)
    )
    db.commit()
