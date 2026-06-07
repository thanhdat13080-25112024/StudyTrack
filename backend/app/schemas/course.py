"""Course request/response schemas."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CourseCategory = Literal["general", "foundation", "specialized", "elective"]
COURSE_CATEGORIES: tuple[str, ...] = ("general", "foundation", "specialized", "elective")


class CourseBase(BaseModel):
    code: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=1, max_length=200)
    credits: int = Field(ge=0, le=30)
    category: CourseCategory | None = None
    is_required: bool = True
    planned_semester_id: int | None = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(CourseBase):
    pass


class CourseOut(CourseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
