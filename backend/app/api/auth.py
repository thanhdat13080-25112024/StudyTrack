"""Auth router: register, login, current-user (get + settings patch)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.profile import Profile
from app.models.user import User
from app.schemas.auth import Token, UserOut, UserRegister, UserSettingsUpdate
from app.schemas.profile import MeOut, ProfileOut

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)) -> Token:
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        profile=Profile(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(access_token=create_access_token(user.email))


@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    user = db.scalar(select(User).where(User.email == form.username))
    if user is None or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user.email))


@router.get("/me", response_model=MeOut)
def read_me(current: User = Depends(get_current_user)) -> MeOut:
    return MeOut(
        user=UserOut.model_validate(current),
        profile=ProfileOut.model_validate(current.profile),
    )


@router.patch("/me", response_model=UserOut)
def update_me(
    data: UserSettingsUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    if data.name is not None:
        current.name = data.name
    if data.lang is not None:
        current.lang = data.lang
    if data.theme is not None:
        current.theme = data.theme
    db.commit()
    db.refresh(current)
    return UserOut.model_validate(current)
