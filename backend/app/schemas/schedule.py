"""Schedule-item request/response schemas."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

TIME_RE = r"^([01]\d|2[0-3]):[0-5]\d$"  # HH:MM 24h


class ScheduleItemCreate(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    time: str = Field(pattern=TIME_RE)
    subject: str = Field(min_length=1, max_length=200)
    course_id: int | None = None
    recurring: bool = True


class ScheduleItemUpdate(BaseModel):
    day_of_week: int | None = Field(default=None, ge=0, le=6)
    time: str | None = Field(default=None, pattern=TIME_RE)
    subject: str | None = Field(default=None, min_length=1, max_length=200)
    course_id: int | None = None
    recurring: bool | None = None


class ScheduleItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    day_of_week: int
    time: str
    subject: str
    course_id: int | None
    recurring: bool
