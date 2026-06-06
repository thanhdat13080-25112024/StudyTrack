"""Profile API tests."""

from __future__ import annotations

from fastapi.testclient import TestClient

REG = {"email": "p@studytrack.app", "password": "secret123", "name": "Pat"}


def _auth(client: TestClient) -> dict:
    token = client.post("/api/auth/register", json=REG).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_profile_defaults(client: TestClient) -> None:
    resp = client.get("/api/profile", headers=_auth(client))
    assert resp.status_code == 200
    body = resp.json()
    assert body["class_name"] == ""
    assert body["avatar_url"] is None
    assert body["target_cpa"] is None


def test_put_profile_updates_identity(client: TestClient) -> None:
    headers = _auth(client)
    resp = client.put(
        "/api/profile",
        json={"class_name": "K65-CNTT", "faculty": "CNTT", "major": "KHMT", "goal": "Top 1"},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["class_name"] == "K65-CNTT"
    assert body["major"] == "KHMT"


def test_put_profile_partial_keeps_others(client: TestClient) -> None:
    headers = _auth(client)
    client.put("/api/profile", json={"faculty": "CNTT"}, headers=headers)
    resp = client.put("/api/profile", json={"major": "KHMT"}, headers=headers)
    assert resp.json()["faculty"] == "CNTT"
    assert resp.json()["major"] == "KHMT"


def test_profile_requires_auth(client: TestClient) -> None:
    assert client.get("/api/profile").status_code == 401
    assert client.put("/api/profile", json={"major": "X"}).status_code == 401
