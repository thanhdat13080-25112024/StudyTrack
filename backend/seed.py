"""Demo-data seeder. Run with: python seed.py"""

from __future__ import annotations

from datetime import date, timedelta

import app.models  # noqa: F401  (register models on Base.metadata)
from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.profile import Profile
from app.models.schedule_item import ScheduleItem
from app.models.study_session import StudySession
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
        today = date.today()
        user = User(
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            name="Demo Student",
            profile=Profile(class_name="K65-CNTT", faculty="CNTT", major="KHMT", goal="GPA 3.6+"),
            study_sessions=[
                StudySession(
                    subject="Giải tích",
                    planned_minutes=25,
                    actual_minutes=25,
                    focus=8,
                    method="Pomodoro",
                    note="Chương 3",
                    session_date=today,
                ),
                StudySession(
                    subject="Lập trình",
                    planned_minutes=60,
                    actual_minutes=55,
                    focus=9,
                    method="Deep Work",
                    note="",
                    session_date=today,
                ),
                StudySession(
                    subject="Tiếng Anh",
                    planned_minutes=30,
                    actual_minutes=30,
                    focus=7,
                    method="Active Recall",
                    note="",
                    session_date=today - timedelta(days=1),
                ),
                StudySession(
                    subject="Vật lý",
                    planned_minutes=45,
                    actual_minutes=40,
                    focus=6,
                    method="Deep Work",
                    note="",
                    session_date=today - timedelta(days=2),
                ),
                StudySession(
                    subject="Giải tích",
                    planned_minutes=50,
                    actual_minutes=50,
                    focus=8,
                    method="Pomodoro",
                    note="",
                    session_date=today - timedelta(days=3),
                ),
            ],
            schedule_items=[
                ScheduleItem(day_of_week=0, time="08:00", subject="Giải tích"),
                ScheduleItem(day_of_week=2, time="13:30", subject="Lập trình"),
                ScheduleItem(day_of_week=4, time="09:15", subject="Tiếng Anh"),
            ],
        )
        db.add(user)
        db.commit()
        print(f"StudyTrack seed: created demo user {DEMO_EMAIL} / {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
