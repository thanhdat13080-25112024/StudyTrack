"""Suggestions API tests."""

from __future__ import annotations

from fastapi.testclient import TestClient

REG = {"email": "sg@studytrack.app", "password": "secret123", "name": "Su"}


def _auth(client: TestClient) -> dict:
    token = client.post("/api/auth/register", json=REG).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_suggestion_pomodoro(client: TestClient) -> None:
    resp = client.post(
        "/api/suggestions",
        json={"method": "Pomodoro", "focus": 9, "planned_minutes": 30},
        headers=_auth(client),
    )
    assert resp.status_code == 200
    assert resp.json()["type"] == "pomodoro_not_25"


def test_suggestion_requires_auth(client: TestClient) -> None:
    assert (
        client.post(
            "/api/suggestions", json={"method": "Pomodoro", "focus": 9, "planned_minutes": 30}
        ).status_code
        == 401
    )
