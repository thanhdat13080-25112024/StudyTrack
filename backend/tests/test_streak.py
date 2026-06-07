"""Unit tests for the streak service (ported from legacy updateStreakLogic)."""

from __future__ import annotations

from datetime import date

from app.services.streak import compute_streak

TODAY = date(2026, 6, 7)


def test_empty_is_zero() -> None:
    assert compute_streak([], TODAY) == 0


def test_today_only_is_one() -> None:
    assert compute_streak([date(2026, 6, 7)], TODAY) == 1


def test_yesterday_only_is_one() -> None:
    assert compute_streak([date(2026, 6, 6)], TODAY) == 1


def test_gap_over_one_day_resets_to_zero() -> None:
    # most recent is 2 days ago -> streak broken
    assert compute_streak([date(2026, 6, 5)], TODAY) == 0


def test_consecutive_run_counts() -> None:
    dates = [date(2026, 6, 7), date(2026, 6, 6), date(2026, 6, 5)]
    assert compute_streak(dates, TODAY) == 3


def test_duplicates_collapse() -> None:
    dates = [date(2026, 6, 7), date(2026, 6, 7), date(2026, 6, 6)]
    assert compute_streak(dates, TODAY) == 2


def test_break_in_chain_stops_count() -> None:
    # 7,6 consecutive then gap (skip 5) to 4 -> stops at 2
    dates = [date(2026, 6, 7), date(2026, 6, 6), date(2026, 6, 4)]
    assert compute_streak(dates, TODAY) == 2


def test_starts_from_yesterday_then_back() -> None:
    dates = [date(2026, 6, 6), date(2026, 6, 5), date(2026, 6, 4)]
    assert compute_streak(dates, TODAY) == 3


def test_future_date_does_not_crash() -> None:
    # Defensive: a session_date in the FUTURE relative to `today` must not crash.
    # Current impl: (today - most_recent).days for a future date is negative, so
    # `> 1` is False and it counts as the start of a run -> 1. Locks behavior.
    assert compute_streak([date(2026, 6, 8)], TODAY) == 1


def test_two_days_ahead_does_not_crash() -> None:
    # Even further in the future still doesn't crash and still yields 1.
    assert compute_streak([date(2026, 6, 9)], TODAY) == 1


def test_future_plus_today_counts_run() -> None:
    # Mixed future + today: most_recent is future (delta <= 1), then today is
    # one day before it -> consecutive run of 2. No crash.
    dates = [date(2026, 6, 8), date(2026, 6, 7)]
    assert compute_streak(dates, TODAY) == 2
