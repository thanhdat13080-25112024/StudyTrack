"""Integration tests for GET /api/analytics — registers user, creates sessions,
checks the endpoint returns the correct shape and applies date-range filters."""

from __future__ import annotations

from datetime import date, timedelta


def _register_and_token(client) -> dict:
    client.post(
        "/api/auth/register",
        json={"email": "ana@test.com", "password": "secret123", "name": "Ana"},
    )
    resp = client.post(
        "/api/auth/login",
        data={"username": "ana@test.com", "password": "secret123"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _create_session(client, headers, *, session_date: str, minutes: int = 30):
    client.post(
        "/api/sessions",
        json={
            "subject": "Math",
            "planned_minutes": minutes,
            "actual_minutes": minutes,
            "focus": 7,
            "method": "Pomodoro",
            "note": "",
            "session_date": session_date,
        },
        headers=headers,
    )


class TestAnalyticsEndpoint:
    def test_unauthenticated(self, client):
        resp = client.get("/api/analytics")
        assert resp.status_code == 401

    def test_empty_sessions(self, client):
        headers = _register_and_token(client)
        resp = client.get("/api/analytics", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["heatmap"] == []
        assert data["time_by_method"] == []
        assert data["time_by_course"] == []
        assert data["focus_trend"] == []
        assert data["weekly_comparison"]["this_week_minutes"] == 0
        assert data["monthly_comparison"]["this_month_minutes"] == 0
        assert data["productivity_score"]["score"] == 0
        assert data["hourly_distribution"] == []
        assert data["method_effectiveness"] == []

    def test_with_sessions(self, client):
        headers = _register_and_token(client)
        today = date.today()
        _create_session(client, headers, session_date=today.isoformat(), minutes=60)
        _create_session(client, headers, session_date=today.isoformat(), minutes=30)

        resp = client.get("/api/analytics", headers=headers)
        assert resp.status_code == 200
        data = resp.json()

        # heatmap should have an entry for today
        assert any(e["date"] == today.isoformat() for e in data["heatmap"])
        heatmap_today = next(e for e in data["heatmap"] if e["date"] == today.isoformat())
        assert heatmap_today["minutes"] == 90

        # time_by_method should aggregate
        assert len(data["time_by_method"]) == 1
        assert data["time_by_method"][0]["method"] == "Pomodoro"
        assert data["time_by_method"][0]["total_minutes"] == 90

        # productivity score should be > 0
        assert data["productivity_score"]["score"] > 0

    def test_date_range_filter(self, client):
        headers = _register_and_token(client)
        today = date.today()
        old_date = today - timedelta(days=60)
        _create_session(client, headers, session_date=old_date.isoformat(), minutes=100)
        _create_session(client, headers, session_date=today.isoformat(), minutes=50)

        # Only recent: should exclude the old session from time_by_method total
        from_str = (today - timedelta(days=7)).isoformat()
        resp = client.get(f"/api/analytics?from_date={from_str}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        total = sum(m["total_minutes"] for m in data["time_by_method"])
        assert total == 50

        # Full range: should include both
        resp = client.get("/api/analytics", headers=headers)
        data = resp.json()
        total = sum(m["total_minutes"] for m in data["time_by_method"])
        assert total == 150
