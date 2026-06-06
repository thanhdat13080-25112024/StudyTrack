"""Demo-data seeder (runnable stub).

Phase 0: there are no models yet, so this only prints a message. Later phases
extend ``seed()`` to populate a demo user, profile, semesters/courses,
enrollments (grades), study sessions, schedule items, and deadlines — using
``app.models`` + ``app.core.security.hash_password`` (never plaintext).

Run with:  python seed.py
"""

from __future__ import annotations


def seed() -> None:
    """Populate demo data. No-op in Phase 0."""
    # Phase 1+: open a session via app.core.db.SessionLocal, create the demo
    # user with hash_password(...), commit, and seed related rows here.
    print("StudyTrack seed: no demo data yet (Phase 0).")


if __name__ == "__main__":
    seed()
