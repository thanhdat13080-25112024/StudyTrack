"""Reminder selection — pure logic deciding which deadlines should fire a
reminder now. The scanner wraps this with DB I/O + WS push."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass(frozen=True)
class DueInput:
    deadline_id: int
    due_at: datetime
    remind_before_minutes: int | None
    done: bool
    reminded_at: datetime | None


def due_reminders(items: list[DueInput], now: datetime) -> list[int]:
    """Return ids of deadlines whose reminder should fire at `now`.

    Fires when: not done, never reminded, has an offset, and
    now >= due_at - remind_before_minutes (so overdue items still fire once).
    """
    out: list[int] = []
    for it in items:
        if it.done or it.reminded_at is not None or it.remind_before_minutes is None:
            continue
        threshold = it.due_at - timedelta(minutes=it.remind_before_minutes)
        if now >= threshold:
            out.append(it.deadline_id)
    return out
