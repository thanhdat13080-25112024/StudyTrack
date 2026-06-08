"""Pluggable email sender + vi/en templates for the two auth flows.

`send_email()` dispatches on settings.EMAIL_BACKEND:
  - "console": logs the message (incl. link) — dev default, no real delivery.
  - "smtp":    sends via the stdlib smtplib (sync — fits FastAPI threadpool handlers).
The rest of the app depends only on `send_email()`; a SaaS backend can be added
later without touching callers.
"""

from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger("studytrack.email")


def _verify_link(raw: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={raw}"


def _reset_link(raw: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={raw}"


def build_verify_email(raw: str, lang: str = "vi") -> tuple[str, str, str]:
    link = _verify_link(raw)
    if lang == "en":
        subject = "Verify your StudyTrack email"
        body = f"Welcome to StudyTrack! Confirm your email: {link}"
    else:
        subject = "Xác thực email StudyTrack"
        body = f"Chào mừng đến StudyTrack! Xác thực email của bạn: {link}"
    html = f"<p>{body}</p>"
    return subject, html, body


def build_reset_email(raw: str, lang: str = "vi") -> tuple[str, str, str]:
    link = _reset_link(raw)
    if lang == "en":
        subject = "Reset your StudyTrack password"
        body = f"Reset your password (link valid 1 hour): {link}"
    else:
        subject = "Đặt lại mật khẩu StudyTrack"
        body = f"Đặt lại mật khẩu của bạn (liên kết có hiệu lực 1 giờ): {link}"
    html = f"<p>{body}</p>"
    return subject, html, body


def send_email(to: str, subject: str, html: str, text: str) -> None:
    backend = settings.EMAIL_BACKEND
    if backend == "smtp":
        _send_smtp(to, subject, html, text)
    else:
        logger.info("EMAIL[console] to=%s subject=%s\n%s", to, subject, text)


def _send_smtp(to: str, subject: str, html: str, text: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg.attach(MIMEText(text, "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))
    try:
        with smtplib.SMTP(settings.EMAIL_SMTP_HOST, settings.EMAIL_SMTP_PORT, timeout=10) as srv:
            if settings.EMAIL_SMTP_USE_TLS:
                srv.starttls()
            if settings.EMAIL_SMTP_USER and settings.EMAIL_SMTP_PASSWORD:
                srv.login(settings.EMAIL_SMTP_USER, settings.EMAIL_SMTP_PASSWORD)
            srv.send_message(msg)
    except Exception:  # noqa: BLE001 — delivery failure must not crash the request
        logger.exception("EMAIL[smtp] failed to send to %s", to)
