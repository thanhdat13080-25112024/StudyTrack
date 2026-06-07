"""Streak computation — faithful port of legacy updateStreakLogic().

A streak is the run of consecutive calendar days (ending at the most recent
study day) on which at least one session was logged. If the most recent study
day is more than one day before `today`, the streak is 0."""

from __future__ import annotations

from datetime import date


def compute_streak(session_dates: list[date], today: date) -> int:
    if not session_dates:
        return 0
    unique_desc = sorted(set(session_dates), reverse=True)
    most_recent = unique_desc[0]
    if (today - most_recent).days > 1:
        return 0
    streak = 1
    for newer, older in zip(unique_desc, unique_desc[1:], strict=False):
        if (newer - older).days == 1:
            streak += 1
        else:
            break
    return streak
