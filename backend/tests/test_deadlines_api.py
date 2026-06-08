from datetime import UTC, datetime, timedelta


def _auth(client, email="d@e.com"):
    r = client.post(
        "/api/auth/register",
        json={"email": email, "password": "pw123456", "name": "D"},
    )
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _due(minutes=120):
    return (datetime.now(UTC) + timedelta(minutes=minutes)).isoformat()


def test_create_and_list_deadline(client):
    h = _auth(client)
    r = client.post(
        "/api/deadlines",
        headers=h,
        json={
            "title": "Essay",
            "type": "assignment",
            "due_at": _due(),
            "remind_before_minutes": 60,
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["title"] == "Essay"
    assert body["priority"] == "medium"
    assert body["done"] is False
    assert body["reminded_at"] is None

    r = client.get("/api/deadlines", headers=h)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_update_toggles_done(client):
    h = _auth(client)
    did = client.post(
        "/api/deadlines",
        headers=h,
        json={"title": "X", "type": "exam", "due_at": _due()},
    ).json()["id"]
    r = client.put(f"/api/deadlines/{did}", headers=h, json={"done": True})
    assert r.status_code == 200
    assert r.json()["done"] is True


def test_delete_deadline(client):
    h = _auth(client)
    did = client.post(
        "/api/deadlines",
        headers=h,
        json={"title": "X", "type": "project", "due_at": _due()},
    ).json()["id"]
    assert client.delete(f"/api/deadlines/{did}", headers=h).status_code == 204
    assert client.get("/api/deadlines", headers=h).json() == []


def test_foreign_course_rejected(client):
    h1 = _auth(client, "a@e.com")
    h2 = _auth(client, "b@e.com")
    # course owned by user 2
    cid = client.post(
        "/api/courses",
        headers=h2,
        json={"code": "CS1", "name": "Intro", "credits": 3},
    ).json()["id"]
    r = client.post(
        "/api/deadlines",
        headers=h1,
        json={"title": "X", "type": "exam", "due_at": _due(), "course_id": cid},
    )
    assert r.status_code == 422


def test_scoped_per_user(client):
    h1 = _auth(client, "u1@e.com")
    h2 = _auth(client, "u2@e.com")
    client.post(
        "/api/deadlines", headers=h1, json={"title": "mine", "type": "exam", "due_at": _due()}
    )
    assert client.get("/api/deadlines", headers=h2).json() == []
