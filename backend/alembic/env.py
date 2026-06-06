"""Alembic migration environment.

Wired to ``settings.DATABASE_URL`` (env) and ``Base.metadata`` so that
``alembic revision --autogenerate`` reflects the SQLAlchemy models. Importing
``app.models`` registers every model on ``Base.metadata``.
"""

from __future__ import annotations

from logging.config import fileConfig

# Importing the models package registers all model tables on Base.metadata.
# (Phase 0: no models yet — this import is a no-op but keeps the wiring ready.)
import app.models  # noqa: F401
from alembic import context
from app.core.config import settings
from app.core.db import Base
from sqlalchemy import engine_from_config, pool

config = context.config

# Inject the runtime DB URL from settings (keeps secrets out of alembic.ini).
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without a DBAPI connection (emits SQL to stdout)."""
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live database connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
