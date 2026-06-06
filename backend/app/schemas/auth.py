"""Auth/user request & response schemas (the OpenAPI contract)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=255)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    lang: str
    theme: str
    created_at: datetime


class UserSettingsUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    lang: str | None = Field(default=None, pattern="^(vi|en)$")
    theme: str | None = Field(default=None, pattern="^(light|dark)$")
