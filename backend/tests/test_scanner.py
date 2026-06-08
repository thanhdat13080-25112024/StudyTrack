from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.models.deadline import Deadline
from app.models.notification import Notification
from app.models.user import User
from app.realtime.scanner import scan_once


def _user(db):
    u = User(email="s@e.com", password_hash="x", name="S")
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def test_scan_creates_notification_and_marks_reminded(db_session):
    u = _user(db_session)
    now = datetime.now(timezone.utc)
    d = Deadline(
        user_id=u.id, title="Soon", type="exam",
        due_at=now + timedelta(minutes=30), remind_before_minutes=60,
    )
    db_session.add(d)
    db_session.commit()

    created = scan_once(db_session, now=now)
    assert len(created) == 1
    notif = db_session.scalar(select(Notification).where(Notification.user_id == u.id))
    assert notif is not None
    assert notif.type == "deadline_reminder"
    assert notif.payload["deadline_id"] == d.id
    db_session.refresh(d)
    assert d.reminded_at is not None


def test_scan_is_idempotent(db_session):
    u = _user(db_session)
    now = datetime.now(timezone.utc)
    db_session.add(
        Deadline(user_id=u.id, title="Soon", type="exam",
                 due_at=now + timedelta(minutes=10), remind_before_minutes=60)
    )
    db_session.commit()
    assert len(scan_once(db_session, now=now)) == 1
    assert len(scan_once(db_session, now=now)) == 0  # already reminded
    assert db_session.scalar(select(Deadline)).reminded_at is not None


def test_scan_skips_done_and_no_offset(db_session):
    u = _user(db_session)
    now = datetime.now(timezone.utc)
    db_session.add_all([
        Deadline(user_id=u.id, title="done", type="exam",
                 due_at=now, remind_before_minutes=60, done=True),
        Deadline(user_id=u.id, title="no-offset", type="exam",
                 due_at=now, remind_before_minutes=None),
    ])
    db_session.commit()
    assert scan_once(db_session, now=now) == []
