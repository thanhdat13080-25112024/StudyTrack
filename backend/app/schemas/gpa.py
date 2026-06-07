"""GPA summary + what-if schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CreditProgress(BaseModel):
    earned: int
    in_progress: int
    remaining: int
    required: int


class SemesterGpa(BaseModel):
    semester_id: int
    code: str
    gpa: float
    credits: int


class GpaSummaryOut(BaseModel):
    cpa: float
    classification: str
    credits: CreditProgress
    semesters: list[SemesterGpa]


class Hypothetical(BaseModel):
    credits: int = Field(ge=0, le=30)
    grade_10: float = Field(ge=0, le=10)


class WhatIfIn(BaseModel):
    target_cpa: float | None = Field(default=None, ge=0, le=4)
    total_credits_required: int | None = Field(default=None, ge=0)
    hypotheticals: list[Hypothetical] = Field(default_factory=list)


class GoalSeekOut(BaseModel):
    required_avg: float | None
    feasible: bool
    already_met: bool
    max_reachable_cpa: float
    remaining_credits: int
    target_tier: str


class ProjectionOut(BaseModel):
    projected_cpa: float
    projected_tier: str


class WhatIfOut(BaseModel):
    goal_seek: GoalSeekOut | None
    projection: ProjectionOut | None
