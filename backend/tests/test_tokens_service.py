"""Tests for the auth-token service (generate/hash/validity + db issue/verify/consume)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from app.models.user import User
from app.services import tokens
from sqlalchemy.orm import Session


def _user(db: Session) -> User:
    u = User(email="t@x.com", password_hash="x", name="T")
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def test_hash_is_deterministic_and_not_raw() -> None:
    raw = tokens.generate_raw_token()
    assert tokens.hash_token(raw) == tokens.hash_token(raw)
    assert tokens.hash_token(raw) != raw
    assert len(tokens.hash_token(raw)) == 64  # sha256 hexdigest


def test_issue_then_verify_roundtrip(db_session: Session) -> None:
    user = _user(db_session)
    raw = tokens.issue_token(db_session, user, "email_verify", timedelta(hours=1))
    found = tokens.verify_token(db_session, raw, "email_verify", datetime.now(UTC))
    assert found is not None and found.user_id == user.id


def test_verify_rejects_expired(db_session: Session) -> None:
    user = _user(db_session)
    raw = tokens.issue_token(db_session, user, "password_reset", timedelta(hours=-1))
    assert tokens.verify_token(db_session, raw, "password_reset", datetime.now(UTC)) is None


def test_verify_rejects_wrong_type(db_session: Session) -> None:
    user = _user(db_session)
    raw = tokens.issue_token(db_session, user, "email_verify", timedelta(hours=1))
    assert tokens.verify_token(db_session, raw, "password_reset", datetime.now(UTC)) is None


def test_consume_makes_token_single_use(db_session: Session) -> None:
    user = _user(db_session)
    raw = tokens.issue_token(db_session, user, "password_reset", timedelta(hours=1))
    tok = tokens.verify_token(db_session, raw, "password_reset", datetime.now(UTC))
    assert tok is not None
    tokens.consume_token(db_session, tok)
    assert tokens.verify_token(db_session, raw, "password_reset", datetime.now(UTC)) is None


def test_verify_unknown_token_returns_none(db_session: Session) -> None:
    assert tokens.verify_token(db_session, "nope", "email_verify", datetime.now(UTC)) is None


def test_issuing_invalidates_prior_token_of_same_type(db_session: Session) -> None:
    user = _user(db_session)
    old = tokens.issue_token(db_session, user, "password_reset", timedelta(hours=1))
    new = tokens.issue_token(db_session, user, "password_reset", timedelta(hours=1))
    now = datetime.now(UTC)
    # the older link no longer works; only the most recent one does
    assert tokens.verify_token(db_session, old, "password_reset", now) is None
    assert tokens.verify_token(db_session, new, "password_reset", now) is not None


def test_issuing_does_not_invalidate_other_type(db_session: Session) -> None:
    user = _user(db_session)
    verify = tokens.issue_token(db_session, user, "email_verify", timedelta(hours=1))
    tokens.issue_token(db_session, user, "password_reset", timedelta(hours=1))
    # issuing a password_reset must not touch the still-valid email_verify token
    assert tokens.verify_token(db_session, verify, "email_verify", datetime.now(UTC)) is not None
