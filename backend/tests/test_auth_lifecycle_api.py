"""Phase 6 auth-lifecycle endpoint tests."""

from __future__ import annotations

import re

import pytest
from app.models.user import User
from app.services import email as email_service
from fastapi.testclient import TestClient
from sqlalchemy import select

REG = {"email": "lc@studytrack.app", "password": "secret123", "name": "LC"}


@pytest.fixture
def outbox(monkeypatch) -> list[dict]:
    """Capture send_email calls so tests can extract the raw token from links."""
    box: list[dict] = []

    def fake_send(to: str, subject: str, html: str, text: str) -> None:
        box.append({"to": to, "subject": subject, "html": html, "text": text})

    monkeypatch.setattr(email_service, "send_email", fake_send)
    return box


def _token_from(box: list[dict], path: str) -> str:
    m = re.search(rf"/{path}\?token=([A-Za-z0-9_\-]+)", box[-1]["text"])
    assert m, f"no {path} token in outbox: {box}"
    return m.group(1)


def _auth_headers(client: TestClient, **over) -> dict:
    body = {**REG, **over}
    token = client.post("/api/auth/register", json=body).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_sends_verify_email_and_user_unverified(client: TestClient, outbox, db_session):
    client.post("/api/auth/register", json=REG)
    user = db_session.scalar(select(User).where(User.email == REG["email"]))
    assert user.email_verified is False
    assert outbox and "verify-email?token=" in outbox[-1]["text"]


def test_verify_email_flow(client: TestClient, outbox, db_session):
    client.post("/api/auth/register", json=REG)
    raw = _token_from(outbox, "verify-email")
    resp = client.post("/api/auth/verify-email", json={"token": raw})
    assert resp.status_code == 204
    db_session.expire_all()
    user = db_session.scalar(select(User).where(User.email == REG["email"]))
    assert user.email_verified is True
    # token is single-use
    assert client.post("/api/auth/verify-email", json={"token": raw}).status_code == 400


def test_forgot_password_unknown_email_returns_204_no_leak(client: TestClient, outbox):
    resp = client.post("/api/auth/forgot-password", json={"email": "nobody@x.com"})
    assert resp.status_code == 204
    assert outbox == []  # no email sent for unknown address


def test_forgot_then_reset_password(client: TestClient, outbox):
    client.post("/api/auth/register", json=REG)
    outbox.clear()
    assert client.post("/api/auth/forgot-password", json={"email": REG["email"]}).status_code == 204
    raw = _token_from(outbox, "reset-password")
    resp = client.post(
        "/api/auth/reset-password", json={"token": raw, "new_password": "newpass123"}
    )
    assert resp.status_code == 204
    # old password rejected, new accepted
    assert (
        client.post(
            "/api/auth/login", data={"username": REG["email"], "password": REG["password"]}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/login", data={"username": REG["email"], "password": "newpass123"}
        ).status_code
        == 200
    )


def test_reset_with_bad_token_400(client: TestClient):
    client.post("/api/auth/register", json=REG)
    assert (
        client.post(
            "/api/auth/reset-password", json={"token": "bogus", "new_password": "whatever1"}
        ).status_code
        == 400
    )


def test_change_password_requires_correct_current(client: TestClient, outbox):
    headers = _auth_headers(client)
    bad = client.post(
        "/api/auth/change-password",
        json={"current_password": "wrong", "new_password": "another123"},
        headers=headers,
    )
    assert bad.status_code == 401
    ok = client.post(
        "/api/auth/change-password",
        json={"current_password": REG["password"], "new_password": "another123"},
        headers=headers,
    )
    assert ok.status_code == 204


def test_resend_verification(client: TestClient, outbox):
    headers = _auth_headers(client)
    outbox.clear()
    assert client.post("/api/auth/resend-verification", headers=headers).status_code == 204
    assert outbox and "verify-email?token=" in outbox[-1]["text"]


def test_delete_account_cascades(client: TestClient, outbox, db_session):
    headers = _auth_headers(client)
    # create a child row (a study session) to prove cascade
    client.post(
        "/api/sessions",
        json={
            "subject": "X",
            "planned_minutes": 25,
            "actual_minutes": 25,
            "focus": 8,
            "method": "Pomodoro",
            "session_date": "2026-06-08",
        },
        headers=headers,
    )
    bad = client.request("DELETE", "/api/auth/me", json={"password": "wrong"}, headers=headers)
    assert bad.status_code == 401
    ok = client.request(
        "DELETE", "/api/auth/me", json={"password": REG["password"]}, headers=headers
    )
    assert ok.status_code == 204
    db_session.expire_all()
    assert db_session.scalar(select(User).where(User.email == REG["email"])) is None


def test_export_returns_all_sections(client: TestClient, outbox):
    headers = _auth_headers(client)
    resp = client.get("/api/auth/me/export", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    for key in (
        "user",
        "profile",
        "sessions",
        "schedule",
        "semesters",
        "courses",
        "grades",
        "prerequisites",
        "deadlines",
        "notifications",
    ):
        assert key in body
