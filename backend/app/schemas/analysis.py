"""Analysis response schemas (weak-subjects + direction)."""

from __future__ import annotations

from pydantic import BaseModel


class WeakSubjectOut(BaseModel):
    course_id: int
    code: str
    name: str
    signals: list[str]
    priority: str
    metrics: dict[str, float]


class CategoryStrengthOut(BaseModel):
    category: str
    avg_grade_4: float
    count: int


class OverloadedSemesterOut(BaseModel):
    code: str
    total_credits: int


class MissingPrereqOut(BaseModel):
    course_id: int
    code: str | None
    missing: list[int]


class DirectionOut(BaseModel):
    category_strengths: list[CategoryStrengthOut]
    strongest_category: str | None
    overloaded_semesters: list[OverloadedSemesterOut]
    missing_prerequisites: list[MissingPrereqOut]
