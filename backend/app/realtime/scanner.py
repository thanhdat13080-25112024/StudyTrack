"""Reminder scanner. `scan_once` is synchronous + directly testable: it selects
due deadlines (via reminders.due_reminders), creates Notification rows, sets
reminded_at, and pushes to connected sockets best-effort. `reminder_loop` runs
it on an interval and is started from the app lifespan."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import SessionLocal
from app.models.deadline import Deadline
from app.models.notification import Notification
from app.realtime.manager import manager
from app.services.reminders import DueInput, due_reminders

logger = logging.getLogger(__name__)


def _as_utc(dt: datetime) -> datetime:
    """Normalize a stored datetime to aware-UTC. SQLite drops tzinfo on read
    (Postgres keeps it); deadlines are persisted as UTC, so a naive value is
    treated as UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def scan_once(db: Session, now: datetime | None = None) -> list[Notification]:
    """Create reminder notifications for any deadlines now due. Idempotent via
    Deadline.reminded_at. Returns the created Notification rows."""
    now = now or datetime.now(UTC)
    candidates = list(
        db.scalars(
            select(Deadline).where(
                Deadline.done.is_(False),
                Deadline.remind_before_minutes.is_not(None),
                Deadline.reminded_at.is_(None),
            )
        )
    )
    inputs = [
        DueInput(
            deadline_id=d.id,
            due_at=_as_utc(d.due_at),
            remind_before_minutes=d.remind_before_minutes,
            done=d.done,
            reminded_at=d.reminded_at,
        )
        for d in candidates
    ]
    due_ids = set(due_reminders(inputs, now))
    by_id = {d.id: d for d in candidates}
    created: list[Notification] = []
    for did in due_ids:
        d = by_id[did]
        notif = Notification(
            user_id=d.user_id,
            type="deadline_reminder",
            payload={"deadline_id": d.id, "title": d.title, "due_at": d.due_at.isoformat()},
        )
        d.reminded_at = now
        db.add(notif)
        created.append(notif)
    if created:
        db.commit()
        for notif in created:
            db.refresh(notif)
            manager.notify_user(
                notif.user_id,
                {"type": "notification", "notification_type": notif.type, "payload": notif.payload},
            )
    return created


async def reminder_loop(stop: asyncio.Event) -> None:
    """Sleep-first loop so fast tests never trigger a scan. Each tick opens a
    short-lived session against the real DB (SessionLocal)."""
    interval = settings.REMINDER_SCAN_SECONDS
    while not stop.is_set():
        try:
            await asyncio.wait_for(stop.wait(), timeout=interval)
            return  # stop signalled
        except TimeoutError:
            pass
        db = SessionLocal()
        try:
            scan_once(db)
        except Exception:
            logger.warning("reminder scan tick failed", exc_info=True)
        finally:
            db.close()
