"""Dashboard API tests."""

from __future__ import annotations

from datetime import date

from fastapi.testclient import TestClient

REG = {"email": "d@studytrack.app", "password": "secret123", "name": "Dee"}


def _auth(client: TestClient) -> dict:
    token = client.post("/api/auth/register", json=REG).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _session(subject: str, minutes: int, d: str) -> dict:
    return {
        "subject": subject, "planned_minutes": minutes, "actual_minutes": minutes,
        "focus": 7, "method": "Deep Work", "session_date": d,
    }


def test_dashboard_shape_empty(client: TestClient) -> None:
    resp = client.get("/api/dashboard", headers=_auth(client))
    assert resp.status_code == 200
    body = resp.json()
    assert set(body) == {"kpis", "chart", "badges", "recent_sessions"}
    assert len(body["chart"]) == 7
    assert len(body["badges"]) == 3
    assert body["kpis"]["total_sessions"] == 0


def test_dashboard_aggregates(client: TestClient) -> None:
    h = _auth(client)
    today = date.today().isoformat()
    client.post("/api/sessions", json=_session("A", 30, today), headers=h)
    client.post("/api/sessions", json=_session("B", 20, today), headers=h)
    body = client.get("/api/dashboard", headers=h).json()
    assert body["kpis"]["today_minutes"] == 50
    assert body["kpis"]["total_sessions"] == 2
    assert body["badges"][0]["unlocked"] is True  # first_session
    assert body["chart"][-1]["minutes"] == 50  # today bucket
    assert len(body["recent_sessions"]) == 2


def test_dashboard_requires_auth(client: TestClient) -> None:
    assert client.get("/api/dashboard").status_code == 401
