"""Prerequisite request/response schemas."""

from __future__ import annotations

from pydantic import BaseModel


class PrerequisiteCreate(BaseModel):
    course_id: int
    prereq_course_id: int


class PrerequisiteOut(BaseModel):
    id: int
    course_id: int
    prereq_course_id: int
    course_code: str
    prereq_code: str
