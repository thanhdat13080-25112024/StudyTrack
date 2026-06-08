"""Deadline request/response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

DeadlineType = Literal["assignment", "exam", "project"]
DeadlinePriority = Literal["low", "medium", "high"]


class DeadlineCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    type: DeadlineType
    due_at: datetime
    course_id: int | None = None
    priority: DeadlinePriority = "medium"
    remind_before_minutes: int | None = Field(default=None, ge=1, le=43200)  # <= 30 days


class DeadlineUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    type: DeadlineType | None = None
    due_at: datetime | None = None
    course_id: int | None = None
    priority: DeadlinePriority | None = None
    remind_before_minutes: int | None = Field(default=None, ge=1, le=43200)
    done: bool | None = None


class DeadlineCourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str


class DeadlineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    type: str
    due_at: datetime
    done: bool
    priority: str
    remind_before_minutes: int | None
    reminded_at: datetime | None
    course_id: int | None
    course: DeadlineCourseOut | None = None
    created_at: datetime
