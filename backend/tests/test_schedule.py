"""Schedule API tests."""

from __future__ import annotations

from fastapi.testclient import TestClient

REG = {"email": "sc@studytrack.app", "password": "secret123", "name": "Sky"}
ITEM = {"day_of_week": 0, "time": "08:30", "subject": "Algebra"}


def _auth(client: TestClient, email: str = REG["email"]) -> dict:
    token = client.post("/api/auth/register", json={**REG, "email": email}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_and_list(client: TestClient) -> None:
    h = _auth(client)
    assert client.post("/api/schedule", json=ITEM, headers=h).status_code == 201
    items = client.get("/api/schedule", headers=h).json()
    assert len(items) == 1 and items[0]["subject"] == "Algebra"


def test_update_item(client: TestClient) -> None:
    h = _auth(client)
    iid = client.post("/api/schedule", json=ITEM, headers=h).json()["id"]
    resp = client.put(f"/api/schedule/{iid}", json={"subject": "Geometry"}, headers=h)
    assert resp.status_code == 200 and resp.json()["subject"] == "Geometry"
    assert resp.json()["time"] == "08:30"  # untouched


def test_delete_item(client: TestClient) -> None:
    h = _auth(client)
    iid = client.post("/api/schedule", json=ITEM, headers=h).json()["id"]
    assert client.delete(f"/api/schedule/{iid}", headers=h).status_code == 204
    assert client.get("/api/schedule", headers=h).json() == []


def test_cannot_touch_others_item(client: TestClient) -> None:
    h1 = _auth(client, "x@studytrack.app")
    h2 = _auth(client, "y@studytrack.app")
    iid = client.post("/api/schedule", json=ITEM, headers=h1).json()["id"]
    assert client.put(f"/api/schedule/{iid}", json={"subject": "Z"}, headers=h2).status_code == 404
    assert client.delete(f"/api/schedule/{iid}", headers=h2).status_code == 404


def test_bad_time_rejected(client: TestClient) -> None:
    resp = client.post("/api/schedule", json={**ITEM, "time": "8:30 SA"}, headers=_auth(client))
    assert resp.status_code == 422


def test_schedule_requires_auth(client: TestClient) -> None:
    assert client.get("/api/schedule").status_code == 401
