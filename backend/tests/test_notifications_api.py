from app.models.notification import Notification


def _auth(client, email="n@e.com"):
    r = client.post(
        "/api/auth/register", json={"email": email, "password": "pw123456", "name": "N"}
    )
    return r.json()["access_token"], {"Authorization": f"Bearer {r.json()['access_token']}"}


def _seed_notifs(db_session, client):
    # create a user via API so a real user_id exists, then insert rows directly
    token, h = _auth(client)
    from app.core.security import decode_access_token
    from app.models.user import User
    from sqlalchemy import select

    email = decode_access_token(token)["sub"]
    uid = db_session.scalar(select(User.id).where(User.email == email))
    for i in range(3):
        db_session.add(Notification(user_id=uid, type="deadline_reminder", payload={"i": i}, read=False))
    db_session.commit()
    return h


def test_list_and_unread_count(client, db_session):
    h = _seed_notifs(db_session, client)
    r = client.get("/api/notifications", headers=h)
    assert r.status_code == 200
    assert len(r.json()) == 3
    assert client.get("/api/notifications/unread-count", headers=h).json()["count"] == 3


def test_unread_only_filter_and_mark_read(client, db_session):
    h = _seed_notifs(db_session, client)
    first_id = client.get("/api/notifications", headers=h).json()[0]["id"]
    assert client.post(f"/api/notifications/{first_id}/read", headers=h).status_code == 204
    assert client.get("/api/notifications/unread-count", headers=h).json()["count"] == 2
    unread = client.get("/api/notifications?unread_only=true", headers=h).json()
    assert len(unread) == 2


def test_read_all(client, db_session):
    h = _seed_notifs(db_session, client)
    assert client.post("/api/notifications/read-all", headers=h).status_code == 204
    assert client.get("/api/notifications/unread-count", headers=h).json()["count"] == 0
