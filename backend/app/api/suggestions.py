"""Suggestions router: structured smart suggestion for the focus form."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.suggestion import SuggestionIn, SuggestionOut
from app.services.suggestions import build_suggestion

router = APIRouter()


@router.post("", response_model=SuggestionOut)
def suggest(
    data: SuggestionIn, current: User = Depends(get_current_user)
) -> dict:
    return build_suggestion(data.method, data.focus, data.planned_minutes)
