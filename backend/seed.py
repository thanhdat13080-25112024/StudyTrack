"""Demo-data seeder. Run with: python seed.py"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

import app.models  # noqa: F401  (register models on Base.metadata)
from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.course import Course
from app.models.grade import Grade
from app.models.prerequisite import Prerequisite
from app.models.profile import Profile
from app.models.schedule_item import ScheduleItem
from app.models.semester import Semester
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
            email_verified=True,
            email_verified_at=datetime.now(UTC),
            profile=Profile(
                class_name="K65-CNTT",
                faculty="CNTT",
                major="KHMT",
                goal="GPA 3.6+",
                target_cpa=3.6,
                total_credits_required=140,
                expected_graduation="2027-06",
                max_credits_per_semester=24,
            ),
            semesters=[
                Semester(code="2024-1", name="HK1 2024-2025"),
                Semester(code="2024-2", name="HK2 2024-2025"),
            ],
            courses=[
                Course(code="CS101", name="Nhập môn CNTT", credits=3, category="foundation"),
                Course(code="MA101", name="Giải tích 1", credits=4, category="general"),
                Course(code="EN101", name="Tiếng Anh 1", credits=3, category="general"),
                Course(
                    code="PE101",
                    name="Giáo dục thể chất",
                    credits=0,
                    category="general",
                    is_required=False,
                ),
                Course(code="CS201", name="Cấu trúc dữ liệu", credits=4, category="specialized"),
                Course(code="CS102", name="Lập trình C", credits=3, category="foundation"),
            ],
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

        # Grades need course/semester IDs, so attach them after the first commit.
        db.refresh(user)
        sem = {s.code: s.id for s in user.semesters}
        crs = {c.code: c.id for c in user.courses}
        db.add_all(
            [
                Grade(
                    user_id=user.id,
                    course_id=crs["CS101"],
                    semester_id=sem["2024-1"],
                    grade_10=8.5,
                    status="passed",
                ),
                Grade(
                    user_id=user.id,
                    course_id=crs["MA101"],
                    semester_id=sem["2024-1"],
                    grade_10=6.0,
                    status="passed",
                ),
                Grade(
                    user_id=user.id,
                    course_id=crs["EN101"],
                    semester_id=sem["2024-1"],
                    grade_10=3.5,
                    status="failed",
                ),
                Grade(
                    user_id=user.id,
                    course_id=crs["PE101"],
                    semester_id=sem["2024-1"],
                    grade_10=None,
                    status="exempt",
                ),
                Grade(
                    user_id=user.id,
                    course_id=crs["EN101"],
                    semester_id=sem["2024-2"],
                    grade_10=7.0,
                    status="passed",
                ),  # retake
                Grade(
                    user_id=user.id,
                    course_id=crs["CS201"],
                    semester_id=sem["2024-2"],
                    grade_10=None,
                    status="in_progress",
                ),
            ]
        )
        db.commit()

        # Phase 4: prerequisites (CS101 -> CS102 -> CS201) + a course-linked
        # study session with low hours so the weak-subject + roadmap demos have data.
        db.add_all(
            [
                Prerequisite(
                    user_id=user.id,
                    course_id=crs["CS102"],
                    prereq_course_id=crs["CS101"],
                ),
                Prerequisite(
                    user_id=user.id,
                    course_id=crs["CS201"],
                    prereq_course_id=crs["CS102"],
                ),
                StudySession(
                    user_id=user.id,
                    course_id=crs["CS201"],
                    subject="Cấu trúc dữ liệu",
                    planned_minutes=30,
                    actual_minutes=20,  # 5 min/credit over 4 credits -> low_study
                    focus=5,
                    method="Pomodoro",
                    note="",
                    session_date=today,
                ),
            ]
        )
        db.commit()

        # Phase 5: demo deadlines (one soon w/ reminder, one a week out).
        from app.models.deadline import Deadline

        now = datetime.now(UTC)
        db.add_all(
            [
                Deadline(
                    user_id=user.id,
                    course_id=None,
                    title="Nộp báo cáo môn CS101",
                    type="assignment",
                    due_at=now + timedelta(hours=20),
                    priority="high",
                    remind_before_minutes=120,
                ),
                Deadline(
                    user_id=user.id,
                    course_id=None,
                    title="Thi giữa kỳ",
                    type="exam",
                    due_at=now + timedelta(days=7),
                    priority="medium",
                    remind_before_minutes=1440,
                    done=False,
                ),
            ]
        )
        db.commit()
        print(f"StudyTrack seed: created demo user {DEMO_EMAIL} / {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
