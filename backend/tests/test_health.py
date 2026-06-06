"""Contract test for the health endpoint.

Defines the Phase 0 contract: ``GET /api/health`` -> 200 ``{"status": "ok"}``.
Runs without any database (the health router has no DB dependency).
"""

from __future__ import annotations

from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_health_returns_ok() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
