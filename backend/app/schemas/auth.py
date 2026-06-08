"""Auth/user request & response schemas (the OpenAPI contract)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, EmailStr, Field

if TYPE_CHECKING:
    from app.schemas.course import CourseOut
    from app.schemas.deadline import DeadlineOut
    from app.schemas.grade import GradeOut
    from app.schemas.notification import NotificationOut
    from app.schemas.prerequisite import PrerequisiteOut
    from app.schemas.profile import ProfileOut
    from app.schemas.schedule import ScheduleItemOut
    from app.schemas.semester import SemesterOut
    from app.schemas.study_session import StudySessionOut


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=255)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    lang: str
    theme: str
    email_verified: bool
    created_at: datetime


class UserSettingsUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    lang: str | None = Field(default=None, pattern="^(vi|en)$")
    theme: str | None = Field(default=None, pattern="^(light|dark)$")


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=6, max_length=128)


class VerifyEmailIn(BaseModel):
    token: str = Field(min_length=1)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=6, max_length=128)


class DeleteAccountIn(BaseModel):
    password: str = Field(min_length=1)


class AccountExport(BaseModel):
    user: UserOut
    profile: ProfileOut
    sessions: list[StudySessionOut]
    schedule: list[ScheduleItemOut]
    semesters: list[SemesterOut]
    courses: list[CourseOut]
    grades: list[GradeOut]
    prerequisites: list[PrerequisiteOut]
    deadlines: list[DeadlineOut]
    notifications: list[NotificationOut]


def rebuild_account_export() -> None:
    """Resolve ``AccountExport``'s forward refs.

    The domain ``*Out`` schemas are imported lazily here (not at module top) to
    avoid a circular import: ``schemas.profile`` already imports ``UserOut`` from
    this module, so importing ``ProfileOut`` at the top would form a cycle. This
    is invoked once from ``app.api.auth`` (loaded after every schema module is
    fully initialised), not at this module's import time.
    """
    from app.schemas.course import CourseOut
    from app.schemas.deadline import DeadlineOut
    from app.schemas.grade import GradeOut
    from app.schemas.notification import NotificationOut
    from app.schemas.prerequisite import PrerequisiteOut
    from app.schemas.profile import ProfileOut
    from app.schemas.schedule import ScheduleItemOut
    from app.schemas.semester import SemesterOut
    from app.schemas.study_session import StudySessionOut

    AccountExport.model_rebuild(
        _types_namespace={
            "CourseOut": CourseOut,
            "DeadlineOut": DeadlineOut,
            "GradeOut": GradeOut,
            "NotificationOut": NotificationOut,
            "PrerequisiteOut": PrerequisiteOut,
            "ProfileOut": ProfileOut,
            "ScheduleItemOut": ScheduleItemOut,
            "SemesterOut": SemesterOut,
            "StudySessionOut": StudySessionOut,
        }
    )
