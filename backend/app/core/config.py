"""Application settings loaded from the environment via pydantic-settings.

Secrets (DATABASE_URL, JWT_SECRET) are never hardcoded — they come from env
or a local ``.env`` file. See ``.env.example`` for the expected keys.
"""

from __future__ import annotations

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Database -----------------------------------------------------------
    # Phase 0 default is a local placeholder; production injects via env.
    # No real DB is required for the health check / health test.
    DATABASE_URL: str = "postgresql+psycopg://studytrack:studytrack@localhost:5432/studytrack"

    # --- Auth / JWT ---------------------------------------------------------
    # Dev-only default; MUST be overridden in any real deployment.
    JWT_SECRET: str = "dev-insecure-change-me"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h

    # --- CORS ---------------------------------------------------------------
    # Comma-separated list in env, e.g. "http://localhost:5173,https://app.example.com"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # --- Realtime ----------------------------------------------------------
    # Background reminder scanner interval (seconds). Tests never trigger a
    # scan because the loop sleeps first; prod/dev default is 60s.
    REMINDER_SCAN_SECONDS: int = 60

    # --- Email --------------------------------------------------------------
    # EMAIL_BACKEND: "console" (dev — logs the link) | "smtp" (prod, stdlib smtplib).
    EMAIL_BACKEND: str = "console"
    EMAIL_FROM: str = "StudyTrack <no-reply@studytrack.app>"
    EMAIL_SMTP_HOST: str | None = None
    EMAIL_SMTP_PORT: int = 587
    EMAIL_SMTP_USER: str | None = None
    EMAIL_SMTP_PASSWORD: str | None = None
    EMAIL_SMTP_USE_TLS: bool = True

    # Base URL of the frontend, used to build email links (verify/reset).
    FRONTEND_URL: str = "http://localhost:5173"

    # --- Auth tokens (email verify + password reset) ------------------------
    EMAIL_VERIFY_TTL_HOURS: int = 48
    PASSWORD_RESET_TTL_HOURS: int = 1

    # --- Rate limiting (slowapi) -------------------------------------------
    # Disabled in tests via conftest (limiter.enabled = False).
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_LOGIN: str = "10/minute"
    RATE_LIMIT_REGISTER: str = "5/hour"
    RATE_LIMIT_FORGOT_PASSWORD: str = "5/hour"
    RATE_LIMIT_RESET_PASSWORD: str = "10/hour"
    RATE_LIMIT_RESEND_VERIFICATION: str = "5/hour"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: object) -> object:
        """Allow CORS_ORIGINS to be provided as a comma-separated string in env."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
