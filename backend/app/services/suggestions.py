"""Structured smart-suggestion builder — port of legacy generateSmartSuggestion.

Returns the suggestion *type* + inputs; the frontend renders the localized
vi/en text. Branching mirrors the legacy if/elif/else exactly."""

from __future__ import annotations


def build_suggestion(method: str, focus: int, planned_minutes: int) -> dict:
    if method == "Pomodoro" and planned_minutes != 25:
        kind = "pomodoro_not_25"
    elif focus >= 8:
        kind = "high_focus"
    else:
        kind = "boost_focus"
    return {"type": kind, "method": method, "focus": focus, "planned_minutes": planned_minutes}
