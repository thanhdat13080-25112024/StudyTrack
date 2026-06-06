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

# Future models are imported here so Alembic sees them, e.g.:
# from app.models.user import User  # noqa: F401

__all__ = ["Base"]
