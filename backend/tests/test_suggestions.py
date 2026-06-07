"""Unit tests for the suggestion service (ported from generateSmartSuggestion)."""

from __future__ import annotations

from app.services.suggestions import build_suggestion


def test_pomodoro_not_25_takes_priority() -> None:
    out = build_suggestion("Pomodoro", focus=9, planned_minutes=30)
    assert out["type"] == "pomodoro_not_25"


def test_pomodoro_exactly_25_falls_through_to_focus() -> None:
    out = build_suggestion("Pomodoro", focus=9, planned_minutes=25)
    assert out["type"] == "high_focus"


def test_high_focus_when_focus_ge_8() -> None:
    assert build_suggestion("Deep Work", focus=8, planned_minutes=60)["type"] == "high_focus"


def test_boost_focus_default() -> None:
    out = build_suggestion("Active Recall", focus=5, planned_minutes=40)
    assert out["type"] == "boost_focus"
    assert out["method"] == "Active Recall"
    assert out["focus"] == 5
    assert out["planned_minutes"] == 40
