"""Profile router: read + update the current user's profile."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.profile import ProfileOut, ProfileUpdate

router = APIRouter()


@router.get("", response_model=ProfileOut)
def read_profile(current: User = Depends(get_current_user)) -> ProfileOut:
    return ProfileOut.model_validate(current.profile)


@router.put("", response_model=ProfileOut)
def update_profile(
    data: ProfileUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileOut:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current.profile, field, value)
    db.commit()
    db.refresh(current.profile)
    return ProfileOut.model_validate(current.profile)
