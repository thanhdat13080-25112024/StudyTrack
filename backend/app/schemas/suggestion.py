"""Smart-suggestion request/response (structured; FE renders localized text)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.study_session import StudyMethod

SuggestionType = Literal["pomodoro_not_25", "high_focus", "boost_focus"]


class SuggestionIn(BaseModel):
    method: StudyMethod
    focus: int = Field(ge=1, le=10)
    planned_minutes: int = Field(ge=0)


class SuggestionOut(BaseModel):
    type: SuggestionType
    method: str
    focus: int
    planned_minutes: int
