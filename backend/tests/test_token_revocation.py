"""JWT revocation on password change/reset (audit fix M2).

Tokens carry an `iat` claim; a token issued before the user's
`password_changed_at` is rejected — a stolen token dies with the password.
"""

import time

from app.core.config import settings
from app.core.security import create_access_token
from jose import jwt


def _register(client, email="revoke@test.dev"):
    r = client.post(
        "/api/auth/register",
        json={"email": email, "password": "secret1", "name": "Revoke"},
    )
    return r.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_old_token_rejected_after_password_change(client):
    fresh = _register(client)
    email = "revoke@test.dev"
    # Token minted well in the past (still unexpired) — simulates a stolen token.
    old = create_access_token(email, extra_claims={"iat": int(time.time()) - 100})
    assert client.get("/api/auth/me", headers=_auth(old)).status_code == 200

    r = client.post(
        "/api/auth/change-password",
        json={"current_password": "secret1", "new_password": "newpass1"},
        headers=_auth(fresh),
    )
    assert r.status_code == 204

    # The pre-change token is now dead; a fresh login works.
    assert client.get("/api/auth/me", headers=_auth(old)).status_code == 401
    r = client.post(
        "/api/auth/login",
        data={"username": email, "password": "newpass1"},
    )
    assert r.status_code == 200
    assert client.get("/api/auth/me", headers=_auth(r.json()["access_token"])).status_code == 200


def test_token_without_iat_rejected_once_password_changed(client):
    fresh = _register(client, "revoke2@test.dev")
    # Legacy token shape (no iat) — must be rejected once a change is recorded.
    legacy = jwt.encode(
        {"sub": "revoke2@test.dev", "exp": int(time.time()) + 3600},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALG,
    )
    assert client.get("/api/auth/me", headers=_auth(legacy)).status_code == 200

    r = client.post(
        "/api/auth/change-password",
        json={"current_password": "secret1", "new_password": "newpass1"},
        headers=_auth(fresh),
    )
    assert r.status_code == 204
    assert client.get("/api/auth/me", headers=_auth(legacy)).status_code == 401


def test_reset_password_also_revokes(client, db_session):
    _register(client, "revoke3@test.dev")
    old = create_access_token("revoke3@test.dev", extra_claims={"iat": int(time.time()) - 100})
    assert client.get("/api/auth/me", headers=_auth(old)).status_code == 200

    # Issue a reset token directly via the service (console email backend in tests).
    from datetime import timedelta

    from app.models.user import User
    from app.services import tokens
    from sqlalchemy import select

    user = db_session.scalar(select(User).where(User.email == "revoke3@test.dev"))
    raw = tokens.issue_token(db_session, user, "password_reset", timedelta(hours=1))

    r = client.post(
        "/api/auth/reset-password",
        json={"token": raw, "new_password": "afterreset1"},
    )
    assert r.status_code == 204
    assert client.get("/api/auth/me", headers=_auth(old)).status_code == 401
