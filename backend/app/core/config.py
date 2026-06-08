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

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors_origins(cls, value: object) -> object:
        """Allow CORS_ORIGINS to be provided as a comma-separated string in env."""
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


settings = Settings()
