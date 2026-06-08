"""SQLAlchemy ORM models.

Importing this package makes ``Base.metadata`` aware of every model, which is
what Alembic's ``env.py`` relies on for autogeneration. No models exist yet
(Phase 0) — User/Profile/Semester/Course/Prerequisite/Enrollment/StudySession/
Schedule/Deadline/Notification arrive in Phases 1+.

When adding a model, define it in its own module here and import it below so it
registers on ``Base.metadata``.
"""

from __future__ import annotations

from app.core.db import Base  # noqa: F401  (re-exported for convenience)
from app.models.course import Course  # noqa: F401
from app.models.deadline import Deadline  # noqa: F401
from app.models.grade import Grade  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.prerequisite import Prerequisite  # noqa: F401
from app.models.profile import Profile  # noqa: F401
from app.models.schedule_item import ScheduleItem  # noqa: F401
from app.models.semester import Semester  # noqa: F401
from app.models.study_session import StudySession  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = [
    "Base",
    "User",
    "Profile",
    "StudySession",
    "ScheduleItem",
    "Semester",
    "Course",
    "Grade",
    "Prerequisite",
    "Deadline",
    "Notification",
]
