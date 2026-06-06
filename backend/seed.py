"""Demo-data seeder. Run with: python seed.py"""

from __future__ import annotations

import app.models  # noqa: F401  (register models on Base.metadata)
from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.profile import Profile
from app.models.user import User
from sqlalchemy import select

DEMO_EMAIL = "demo@studytrack.app"
DEMO_PASSWORD = "studytrack"


def seed() -> None:
    db = SessionLocal()
    try:
        if db.scalar(select(User).where(User.email == DEMO_EMAIL)):
            print(f"StudyTrack seed: {DEMO_EMAIL} already exists — skipping.")
            return
        user = User(
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            name="Demo Student",
            profile=Profile(class_name="K65-CNTT", faculty="CNTT", major="KHMT", goal="GPA 3.6+"),
        )
        db.add(user)
        db.commit()
        print(f"StudyTrack seed: created demo user {DEMO_EMAIL} / {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
