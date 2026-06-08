"""Auth router: register, login, current-user (get + settings patch) plus the
Phase-6 account lifecycle — email verification, forgot/reset password, change
password, account deletion, and a full data export."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.core.ratelimit import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.models.course import Course
from app.models.deadline import Deadline
from app.models.grade import Grade
from app.models.notification import Notification
from app.models.prerequisite import Prerequisite
from app.models.profile import Profile
from app.models.schedule_item import ScheduleItem
from app.models.semester import Semester
from app.models.study_session import StudySession
from app.models.user import User
from app.schemas.auth import (
    AccountExport,
    ChangePasswordIn,
    DeleteAccountIn,
    ForgotPasswordIn,
    ResetPasswordIn,
    Token,
    UserOut,
    UserRegister,
    UserSettingsUpdate,
    VerifyEmailIn,
    rebuild_account_export,
)
from app.schemas.grade import CourseSummary, GradeOut, SemesterSummary
from app.schemas.prerequisite import PrerequisiteOut
from app.schemas.profile import MeOut, ProfileOut
from app.services import email as email_service
from app.services import tokens
from app.services.gpa_engine import grade_to_grade4, grade_to_letter

# AccountExport aggregates every domain *Out schema; resolve its forward refs now
# that all schema modules are importable (avoids a schemas.profile import cycle).
rebuild_account_export()

router = APIRouter()


def _send_verify(db: Session, user: User) -> None:
    raw = tokens.issue_token(
        db, user, "email_verify", timedelta(hours=settings.EMAIL_VERIFY_TTL_HOURS)
    )
    subject, html, text = email_service.build_verify_email(raw, lang=user.lang)
    email_service.send_email(user.email, subject, html, text)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_REGISTER)
def register(request: Request, data: UserRegister, db: Session = Depends(get_db)) -> Token:
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
    _send_verify(db, user)
    return Token(access_token=create_access_token(user.email))


@router.post("/login", response_model=Token)
@limiter.limit(settings.RATE_LIMIT_LOGIN)
def login(
    request: Request,
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


# --- Email verification -----------------------------------------------------
@router.post("/verify-email", status_code=status.HTTP_204_NO_CONTENT)
def verify_email(data: VerifyEmailIn, db: Session = Depends(get_db)) -> None:
    token = tokens.verify_token(db, data.token, "email_verify", datetime.now(UTC))
    if token is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired token")
    user = db.get(User, token.user_id)
    user.email_verified = True
    user.email_verified_at = datetime.now(UTC)
    tokens.consume_token(db, token)
    db.commit()


@router.post("/resend-verification", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_RESEND_VERIFICATION)
def resend_verification(
    request: Request,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if not current.email_verified:
        _send_verify(db, current)


# --- Password reset ---------------------------------------------------------
@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_FORGOT_PASSWORD)
def forgot_password(
    request: Request, data: ForgotPasswordIn, db: Session = Depends(get_db)
) -> None:
    user = db.scalar(select(User).where(User.email == data.email))
    if user is not None:
        raw = tokens.issue_token(
            db, user, "password_reset", timedelta(hours=settings.PASSWORD_RESET_TTL_HOURS)
        )
        subject, html, text = email_service.build_reset_email(raw, lang=user.lang)
        email_service.send_email(user.email, subject, html, text)
    # Always 204 — never reveal whether the email exists.


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_RESET_PASSWORD)
def reset_password(request: Request, data: ResetPasswordIn, db: Session = Depends(get_db)) -> None:
    token = tokens.verify_token(db, data.token, "password_reset", datetime.now(UTC))
    if token is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired token")
    user = db.get(User, token.user_id)
    user.password_hash = hash_password(data.new_password)
    tokens.consume_token(db, token)
    db.commit()


# --- Change password / delete / export --------------------------------------
@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    data: ChangePasswordIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if not verify_password(data.current_password, current.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Current password is incorrect")
    current.password_hash = hash_password(data.new_password)
    db.commit()


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    data: DeleteAccountIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    if not verify_password(data.password, current.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Password is incorrect")
    db.delete(current)  # FK CASCADE removes all child rows
    db.commit()


def _grade_out(g: Grade) -> GradeOut:
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


def _prereq_out(p: Prerequisite) -> PrerequisiteOut:
    return PrerequisiteOut(
        id=p.id,
        course_id=p.course_id,
        prereq_course_id=p.prereq_course_id,
        course_code=p.course.code,
        prereq_code=p.prereq_course.code,
    )


@router.get("/me/export", response_model=AccountExport)
def export_account(
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AccountExport:
    uid = current.id

    def rows(model):
        return list(db.scalars(select(model).where(model.user_id == uid).order_by(model.id)))

    return AccountExport(
        user=UserOut.model_validate(current),
        profile=ProfileOut.model_validate(current.profile),
        sessions=rows(StudySession),
        schedule=rows(ScheduleItem),
        semesters=rows(Semester),
        courses=rows(Course),
        grades=[_grade_out(g) for g in rows(Grade)],
        prerequisites=[_prereq_out(p) for p in rows(Prerequisite)],
        deadlines=rows(Deadline),
        notifications=rows(Notification),
    )
