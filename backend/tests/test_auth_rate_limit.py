"""Verify slowapi returns 429 once a public auth limit is exceeded."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def limited_client(client: TestClient):
    from app.main import limiter

    limiter.enabled = True
    limiter.reset()
    try:
        yield client
    finally:
        limiter.enabled = False
        limiter.reset()


def test_forgot_password_rate_limited(limited_client: TestClient, monkeypatch):
    # default RATE_LIMIT_FORGOT_PASSWORD = "5/hour"
    statuses = [
        limited_client.post("/api/auth/forgot-password", json={"email": "x@y.com"}).status_code
        for _ in range(7)
    ]
    assert 429 in statuses
    assert statuses.count(204) <= 5
