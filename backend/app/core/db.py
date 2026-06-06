"""SQLAlchemy 2.0 engine, session factory, and declarative base.

The engine is created lazily-eagerly at import, but no connection is opened
until a session actually queries — so importing this module (and therefore the
FastAPI app and the health test) does NOT require a running Postgres.
"""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models.

    Models register their tables on ``Base.metadata``; Alembic reads that as
    ``target_metadata`` for autogeneration. No models exist yet (Phase 0).
    """


# ``pool_pre_ping`` avoids stale-connection errors after DB restarts.
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
