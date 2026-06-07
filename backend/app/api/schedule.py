"""Schedule router: full CRUD for recurring weekly items (per-user scoped)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.schedule_item import ScheduleItem
from app.models.user import User
from app.schemas.schedule import ScheduleItemCreate, ScheduleItemOut, ScheduleItemUpdate

router = APIRouter()


def _get_owned(db: Session, item_id: int, user_id: int) -> ScheduleItem:
    item = db.scalar(
        select(ScheduleItem).where(ScheduleItem.id == item_id, ScheduleItem.user_id == user_id)
    )
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule item not found")
    return item


@router.get("", response_model=list[ScheduleItemOut])
def list_items(
    current: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[ScheduleItem]:
    stmt = (
        select(ScheduleItem)
        .where(ScheduleItem.user_id == current.id)
        .order_by(ScheduleItem.day_of_week, ScheduleItem.time)
    )
    return list(db.scalars(stmt))


@router.post("", response_model=ScheduleItemOut, status_code=status.HTTP_201_CREATED)
def create_item(
    data: ScheduleItemCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScheduleItem:
    item = ScheduleItem(user_id=current.id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ScheduleItemOut)
def update_item(
    item_id: int,
    data: ScheduleItemUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScheduleItem:
    item = _get_owned(db, item_id, current.id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    item = _get_owned(db, item_id, current.id)
    db.delete(item)
    db.commit()
