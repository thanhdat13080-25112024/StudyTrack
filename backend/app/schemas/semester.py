"""Semester request/response schemas."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class SemesterBase(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str | None = Field(default=None, max_length=120)
    start_date: date | None = None
    end_date: date | None = None


class SemesterCreate(SemesterBase):
    pass


class SemesterUpdate(SemesterBase):
    pass


class SemesterOut(SemesterBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
