"""Profile schemas + the combined /me response."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserOut

# ~500KB of base64 (4/3 expansion + data-URI prefix headroom)
MAX_AVATAR_LEN = 700_000


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    class_name: str
    faculty: str
    major: str
    goal: str
    avatar_url: str | None
    target_cpa: float | None
    total_credits_required: int | None
    expected_graduation: str | None
    max_credits_per_semester: int | None


class ProfileUpdate(BaseModel):
    class_name: str | None = Field(default=None, max_length=120)
    faculty: str | None = Field(default=None, max_length=120)
    major: str | None = Field(default=None, max_length=120)
    goal: str | None = Field(default=None, max_length=2000)
    avatar_url: str | None = Field(default=None, max_length=MAX_AVATAR_LEN)
    target_cpa: float | None = Field(default=None, ge=0, le=4)
    total_credits_required: int | None = Field(default=None, ge=0)
    expected_graduation: str | None = Field(default=None, max_length=32)
    max_credits_per_semester: int | None = Field(default=None, ge=1, le=50)


class MeOut(BaseModel):
    user: UserOut
    profile: ProfileOut
