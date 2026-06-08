"""Roadmap request/response schemas (mirror the roadmap_engine dict shape)."""

from __future__ import annotations

from pydantic import BaseModel


class RoadmapIn(BaseModel):
    start_code: str | None = None
    max_credits_per_semester: int | None = None


class RoadmapCourseOut(BaseModel):
    course_id: int
    code: str
    name: str
    credits: int
    is_required: bool


class RoadmapSemesterOut(BaseModel):
    code: str
    courses: list[RoadmapCourseOut]
    total_credits: int


class RoadmapWarningOut(BaseModel):
    type: str
    course_ids: list[int] | None = None
    detail: str | None = None


class RoadmapOut(BaseModel):
    semesters: list[RoadmapSemesterOut]
    warnings: list[RoadmapWarningOut]
