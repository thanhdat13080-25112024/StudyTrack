from app.models.notification import Notification
from app.models.user import User
from sqlalchemy import select


def _auth(client, email="bdg@e.com"):
    r = client.post(
        "/api/auth/register", json={"email": email, "password": "pw123456", "name": "B"}
    )
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_first_session_creates_badge_notification(client, db_session):
    h = _auth(client)
    r = client.post(
        "/api/sessions",
        headers=h,
        json={
            "subject": "Math",
            "planned_minutes": 25,
            "actual_minutes": 25,
            "focus": 8,
            "method": "Pomodoro",
            "session_date": "2026-06-08",
        },
    )
    assert r.status_code == 201, r.text
    uid = db_session.scalar(select(User.id).where(User.email == "bdg@e.com"))
    notifs = list(
        db_session.scalars(
            select(Notification).where(
                Notification.user_id == uid, Notification.type == "badge_unlocked"
            )
        )
    )
    keys = {n.payload["badge_key"] for n in notifs}
    assert "first_session" in keys


def test_second_session_does_not_reduplicate_first_badge(client, db_session):
    h = _auth(client, "bdg2@e.com")
    body = {
        "subject": "Math",
        "planned_minutes": 25,
        "actual_minutes": 25,
        "focus": 8,
        "method": "Pomodoro",
        "session_date": "2026-06-08",
    }
    client.post("/api/sessions", headers=h, json=body)
    client.post("/api/sessions", headers=h, json=body)
    uid = db_session.scalar(select(User.id).where(User.email == "bdg2@e.com"))
    first_badges = list(
        db_session.scalars(
            select(Notification).where(
                Notification.user_id == uid, Notification.type == "badge_unlocked"
            )
        )
    )
    keys = [n.payload["badge_key"] for n in first_badges]
    assert keys.count("first_session") == 1
