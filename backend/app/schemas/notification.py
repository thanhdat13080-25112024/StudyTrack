"""Notification response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    payload: dict[str, Any]
    read: bool
    created_at: datetime


class UnreadCountOut(BaseModel):
    count: int
