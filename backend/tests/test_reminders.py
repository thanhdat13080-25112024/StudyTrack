from datetime import UTC, datetime, timedelta

from app.services.reminders import DueInput, due_reminders

NOW = datetime(2026, 6, 8, 12, 0, tzinfo=UTC)


def _item(id, *, due_in_min, remind_before=60, done=False, reminded=False):
    return DueInput(
        deadline_id=id,
        due_at=NOW + timedelta(minutes=due_in_min),
        remind_before_minutes=remind_before,
        done=done,
        reminded_at=NOW if reminded else None,
    )


def test_fires_when_within_reminder_window():
    # due in 30 min, remind 60 min before -> threshold passed
    assert due_reminders([_item(1, due_in_min=30, remind_before=60)], NOW) == [1]


def test_not_yet_within_window():
    # due in 120 min, remind 60 min before -> not yet
    assert due_reminders([_item(1, due_in_min=120, remind_before=60)], NOW) == []


def test_boundary_exactly_at_threshold_fires():
    # due in 60 min, remind 60 min before -> now == due - 60 -> fires
    assert due_reminders([_item(1, due_in_min=60, remind_before=60)], NOW) == [1]


def test_done_excluded():
    assert due_reminders([_item(1, due_in_min=10, done=True)], NOW) == []


def test_no_offset_excluded():
    assert due_reminders([_item(1, due_in_min=10, remind_before=None)], NOW) == []


def test_already_reminded_excluded():
    assert due_reminders([_item(1, due_in_min=10, reminded=True)], NOW) == []


def test_overdue_still_fires_once():
    # past due, never reminded -> still fire (user should know it's overdue)
    assert due_reminders([_item(1, due_in_min=-30, remind_before=60)], NOW) == [1]
