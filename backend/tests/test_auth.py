"""Auth API tests."""

from __future__ import annotations

from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

REG = {"email": "demo@studytrack.app", "password": "secret123", "name": "Demo"}


def _register(client: TestClient, **over) -> dict:
    return client.post("/api/auth/register", json={**REG, **over}).json()


def test_register_returns_token(client: TestClient) -> None:
    resp = client.post("/api/auth/register", json=REG)
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_register_duplicate_email_conflicts(client: TestClient) -> None:
    client.post("/api/auth/register", json=REG)
    resp = client.post("/api/auth/register", json=REG)
    assert resp.status_code == 409


def test_password_is_hashed_not_plaintext(client: TestClient, db_session: Session) -> None:
    client.post("/api/auth/register", json=REG)
    user = db_session.scalar(select(User).where(User.email == REG["email"]))
    assert user is not None
    assert user.password_hash != REG["password"]
    assert user.password_hash.startswith("$argon2")


def test_login_success(client: TestClient) -> None:
    client.post("/api/auth/register", json=REG)
    resp = client.post(
        "/api/auth/login",
        data={"username": REG["email"], "password": REG["password"]},
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_login_wrong_password_401(client: TestClient) -> None:
    client.post("/api/auth/register", json=REG)
    resp = client.post(
        "/api/auth/login",
        data={"username": REG["email"], "password": "wrong"},
    )
    assert resp.status_code == 401


def test_login_unknown_email_401(client: TestClient) -> None:
    resp = client.post(
        "/api/auth/login",
        data={"username": "nobody@x.com", "password": "secret123"},
    )
    assert resp.status_code == 401


def test_me_requires_auth(client: TestClient) -> None:
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_user_and_profile(client: TestClient) -> None:
    token = _register(client)["access_token"]
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["email"] == REG["email"]
    assert body["user"]["lang"] == "vi"
    assert body["user"]["theme"] == "dark"
    assert body["profile"]["class_name"] == ""


def test_patch_me_updates_settings(client: TestClient) -> None:
    token = _register(client)["access_token"]
    resp = client.patch(
        "/api/auth/me",
        json={"lang": "en", "theme": "light", "name": "New Name"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["lang"] == "en"
    assert body["theme"] == "light"
    assert body["name"] == "New Name"
