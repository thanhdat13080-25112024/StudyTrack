"""Study-session request/response schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Centralized method list (matches legacy <select> options + CLAUDE.md).
StudyMethod = Literal["Pomodoro", "Deep Work", "Active Recall"]
STUDY_METHODS: tuple[str, ...] = ("Pomodoro", "Deep Work", "Active Recall")


class StudySessionCreate(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    planned_minutes: int = Field(ge=0)
    actual_minutes: int = Field(ge=1)
    focus: int = Field(ge=1, le=10)
    method: StudyMethod
    note: str = Field(default="", max_length=2000)
    session_date: date
    started_at: datetime | None = None
    ended_at: datetime | None = None
    course_id: int | None = None


class SessionCourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str


class StudySessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    subject: str
    planned_minutes: int
    actual_minutes: int
    focus: int
    method: str
    note: str
    session_date: date
    started_at: datetime | None
    ended_at: datetime | None
    course_id: int | None
    course: SessionCourseOut | None = None
