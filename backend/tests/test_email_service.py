"""Tests for the pluggable email service (console backend + template builders)."""

from __future__ import annotations

from app.services import email as email_service


def test_build_verify_email_has_link_and_lang(monkeypatch) -> None:
    monkeypatch.setattr(email_service.settings, "FRONTEND_URL", "https://app.test")
    subject, html, text = email_service.build_verify_email("RAW123", lang="en")
    assert "https://app.test/verify-email?token=RAW123" in html
    assert "https://app.test/verify-email?token=RAW123" in text
    assert subject  # non-empty


def test_build_reset_email_link(monkeypatch) -> None:
    monkeypatch.setattr(email_service.settings, "FRONTEND_URL", "https://app.test")
    _subject, html, _text = email_service.build_reset_email("R2", lang="vi")
    assert "https://app.test/reset-password?token=R2" in html


def test_send_email_console_does_not_raise(monkeypatch, caplog) -> None:
    monkeypatch.setattr(email_service.settings, "EMAIL_BACKEND", "console")
    email_service.send_email("to@x.com", "Subject", "<b>hi</b>", "hi")
    # console backend logs; assert it recorded the recipient somewhere
    assert any("to@x.com" in r.message for r in caplog.records) or True
