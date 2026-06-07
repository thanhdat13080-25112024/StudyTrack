"""Study-session API tests."""

from __future__ import annotations

from fastapi.testclient import TestClient

REG = {"email": "s@studytrack.app", "password": "secret123", "name": "Sam"}
SESSION = {
    "subject": "Calculus",
    "planned_minutes": 25,
    "actual_minutes": 25,
    "focus": 8,
    "method": "Pomodoro",
    "note": "ch.3",
    "session_date": "2026-06-07",
}


def _auth(client: TestClient, email: str = REG["email"]) -> dict:
    token = client.post("/api/auth/register", json={**REG, "email": email}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_session(client: TestClient) -> None:
    resp = client.post("/api/sessions", json=SESSION, headers=_auth(client))
    assert resp.status_code == 201
    body = resp.json()
    assert body["subject"] == "Calculus"
    assert body["actual_minutes"] == 25
    assert body["id"] > 0


def test_list_sessions_newest_first(client: TestClient) -> None:
    h = _auth(client)
    client.post(
        "/api/sessions", json={**SESSION, "subject": "A", "session_date": "2026-06-05"}, headers=h
    )
    client.post(
        "/api/sessions", json={**SESSION, "subject": "B", "session_date": "2026-06-07"}, headers=h
    )
    resp = client.get("/api/sessions", headers=h)
    assert resp.status_code == 200
    subjects = [s["subject"] for s in resp.json()]
    assert subjects[0] == "B"  # newest session_date first


def test_delete_own_session(client: TestClient) -> None:
    h = _auth(client)
    sid = client.post("/api/sessions", json=SESSION, headers=h).json()["id"]
    assert client.delete(f"/api/sessions/{sid}", headers=h).status_code == 204
    assert client.get("/api/sessions", headers=h).json() == []


def test_cannot_delete_others_session(client: TestClient) -> None:
    h1 = _auth(client, "a@studytrack.app")
    h2 = _auth(client, "b@studytrack.app")
    sid = client.post("/api/sessions", json=SESSION, headers=h1).json()["id"]
    assert client.delete(f"/api/sessions/{sid}", headers=h2).status_code == 404


def test_invalid_method_rejected(client: TestClient) -> None:
    resp = client.post("/api/sessions", json={**SESSION, "method": "Nope"}, headers=_auth(client))
    assert resp.status_code == 422


def test_sessions_require_auth(client: TestClient) -> None:
    assert client.get("/api/sessions").status_code == 401
    assert client.post("/api/sessions", json=SESSION).status_code == 401


def test_session_links_to_owned_course(client: TestClient) -> None:
    h = _auth(client)
    c = client.post("/api/courses", json={"code": "LNK", "name": "LNK", "credits": 3}, headers=h)
    cid = c.json()["id"]
    resp = client.post("/api/sessions", json={**SESSION, "course_id": cid}, headers=h)
    assert resp.status_code == 201
    assert resp.json()["course"]["code"] == "LNK"


def test_session_rejects_foreign_course(client: TestClient) -> None:
    h1 = _auth(client, "a@studytrack.app")
    h2 = _auth(client, "b@studytrack.app")
    c = client.post("/api/courses", json={"code": "F", "name": "F", "credits": 3}, headers=h2)
    cid = c.json()["id"]
    resp = client.post("/api/sessions", json={**SESSION, "course_id": cid}, headers=h1)
    assert resp.status_code == 422
