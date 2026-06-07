"""Grade request/response schemas. `letter`/`grade_4` are computed by the engine
and embedded in the response; `course`/`semester` are minimal summaries so the
grades table renders in one call."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

GradeStatus = Literal["in_progress", "passed", "failed", "exempt"]
GRADE_STATUSES: tuple[str, ...] = ("in_progress", "passed", "failed", "exempt")


class GradeBase(BaseModel):
    course_id: int
    semester_id: int
    grade_10: float | None = Field(default=None, ge=0, le=10)
    status: GradeStatus

    @model_validator(mode="after")
    def _grade_status_consistent(self) -> GradeBase:
        graded = self.status in ("passed", "failed")
        if graded and self.grade_10 is None:
            raise ValueError("grade_10 is required when status is passed/failed")
        if not graded and self.grade_10 is not None:
            raise ValueError("grade_10 must be empty when status is in_progress/exempt")
        return self


class GradeCreate(GradeBase):
    pass


class GradeUpdate(GradeBase):
    pass


class CourseSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    name: str
    credits: int
    category: str | None


class SemesterSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str


class GradeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_id: int
    semester_id: int
    grade_10: float | None
    status: str
    letter: str | None
    grade_4: float | None
    course: CourseSummary
    semester: SemesterSummary
