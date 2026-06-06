# Phase 1 — Auth + User Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan is driven by the `studytrack-build` orchestrator; each task names the owning specialist agent.

**Goal:** Add real argon2 + JWT authentication and the User/Profile foundation (backend models, migration, routers, tests; frontend auth pages, profile + virtual student-ID card, token-based auth, server-synced i18n/theme) on top of the Phase 0 scaffold.

**Architecture:** FastAPI backend exposes `auth` + `profile` routers under `/api`, backed by SQLAlchemy `User`/`Profile` models and a single Alembic migration. JWT bearer tokens (24h, argon2-hashed passwords) authorize requests via a real `get_current_user`. React frontend stores the token in `localStorage`, attaches it as `Authorization: Bearer`, guards routes, and syncs language/theme to the server. The FE↔BE contract is the OpenAPI schema, regenerated into `api-types.ts`.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, python-jose, passlib[argon2], pytest (SQLite). React 18 + TS + Vite, TanStack Query, Zustand, react-hook-form + zod, react-i18next, Tailwind/shadcn, Vitest/RTL.

**Spec:** `docs/superpowers/specs/2026-06-06-phase1-auth-user-design.md`
**Branch:** `feat/p1-auth` (already created off `main`).

---

## File Structure

**Backend (create):**
- `backend/app/models/user.py` — `User` model
- `backend/app/models/profile.py` — `Profile` model
- `backend/app/schemas/auth.py` — `Token`, `UserRegister`, `UserOut`, `UserSettingsUpdate`
- `backend/app/schemas/profile.py` — `ProfileOut`, `ProfileUpdate`, `MeOut`
- `backend/app/api/auth.py` — register / login / me (GET, PATCH)
- `backend/app/api/profile.py` — profile (GET, PUT)
- `backend/tests/conftest.py` — SQLite test DB + TestClient fixtures
- `backend/tests/test_auth.py`, `backend/tests/test_profile.py`
- `backend/alembic/versions/0001_user_profile.py` — migration

**Backend (modify):**
- `backend/pyproject.toml` — add `email-validator`
- `backend/app/models/__init__.py` — import User, Profile
- `backend/app/core/deps.py` — real `get_current_user`
- `backend/app/main.py` — mount routers
- `backend/seed.py` — demo user + profile

**Frontend (create):**
- `frontend/src/features/auth/types.ts` — typed contract re-exports
- `frontend/src/features/auth/hooks.ts` — TanStack Query hooks
- `frontend/src/store/authStore.ts` — Zustand auth store
- `frontend/src/components/auth/AuthForm.tsx`, `RequireAuth.tsx`
- `frontend/src/components/StudentIdCard.tsx`
- `frontend/src/components/ui/input.tsx`, `label.tsx` (shadcn primitives)
- `frontend/src/pages/Login.tsx`, `Register.tsx`, `Profile.tsx`
- Test files: `authStore.test.ts`, `StudentIdCard.test.tsx`, `AuthForm.test.tsx`, `RequireAuth.test.tsx`

**Frontend (modify):**
- `frontend/package.json` — add `@hookform/resolvers`
- `frontend/src/lib/apiClient.ts` — Bearer token + 401 handling + `postForm`
- `frontend/src/lib/api-types.ts` — regenerated via `make gen-types`
- `frontend/src/lib/theme.ts` — `applyTheme` exported for sync (already exported)
- `frontend/src/store/uiStore.ts` — accept server-driven theme/lang
- `frontend/src/App.tsx` — routes + guards
- `frontend/src/locales/vi.json`, `en.json` — auth/profile/studentId keys

**Docs (modify):** `README.md`, `CLAUDE.md`, `CLAUDE-VIE.md`, `GEMINI.md`, `GEMINI-VIE.md`

---

# WAVE A — Backend (owner: `backend-engineer`, TDD)

> Read skill `.claude/skills/studytrack-backend/SKILL.md` first. Use `superpowers:test-driven-development`. Run all backend commands from `backend/` with the project venv active.

## Task A0: Add `email-validator` dependency

**Files:** Modify `backend/pyproject.toml`

- [ ] **Step 1: Add the dependency**

In `backend/pyproject.toml`, under `[project] dependencies`, add this line after `"passlib[argon2]>=1.7",`:

```toml
    "email-validator>=2.1",
```

- [ ] **Step 2: Install**

Run: `cd backend && pip install -e ".[dev]"`
Expected: installs `email-validator` (Pydantic `EmailStr` needs it).

- [ ] **Step 3: Commit**

```bash
git add backend/pyproject.toml
git commit -m "build(backend): add email-validator for Pydantic EmailStr"
```

## Task A1: User + Profile models

**Files:**
- Create: `backend/app/models/user.py`, `backend/app/models/profile.py`
- Modify: `backend/app/models/__init__.py`

- [ ] **Step 1: Write `user.py`**

```python
"""User model — identity + auth + persisted UI prefs (lang/theme)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class User(Base):
    __tablename__ = "users"  # "user" is reserved in Postgres — use "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    lang: Mapped[str] = mapped_column(String(8), default="vi", nullable=False)
    theme: Mapped[str] = mapped_column(String(8), default="dark", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    profile: Mapped["Profile"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
```

- [ ] **Step 2: Write `profile.py`**

```python
"""Profile model — 1:1 with User. Identity fields used now; academic fields
(nullable) reserved for Phase 3. Plan abbreviates the column as `class`, but
that is a Python keyword, so the attribute/JSON field is `class_name`."""

from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Identity (surfaced in the Phase 1 UI)
    class_name: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    faculty: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    major: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    goal: Mapped[str] = mapped_column(Text, default="", nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # base64 data-URI

    # Academic (nullable, unused until Phase 3)
    target_cpa: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_credits_required: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_graduation: Mapped[str | None] = mapped_column(String(32), nullable=True)

    user: Mapped["User"] = relationship(back_populates="profile")
```

- [ ] **Step 3: Register models in `__init__.py`**

Replace the body of `backend/app/models/__init__.py`'s "Future models" comment block with real imports:

```python
from app.core.db import Base  # noqa: F401  (re-exported for convenience)
from app.models.profile import Profile  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = ["Base", "User", "Profile"]
```

- [ ] **Step 4: Verify import + metadata**

Run: `cd backend && python -c "import app.models; print(sorted(app.models.Base.metadata.tables))"`
Expected: `['profiles', 'users']`

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/
git commit -m "feat(backend): add User and Profile models"
```

## Task A2: Pydantic schemas

**Files:** Create `backend/app/schemas/auth.py`, `backend/app/schemas/profile.py`

- [ ] **Step 1: Write `auth.py`**

```python
"""Auth/user request & response schemas (the OpenAPI contract)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=255)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    lang: str
    theme: str
    created_at: datetime


class UserSettingsUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    lang: str | None = Field(default=None, pattern="^(vi|en)$")
    theme: str | None = Field(default=None, pattern="^(light|dark)$")
```

- [ ] **Step 2: Write `profile.py`**

```python
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


class ProfileUpdate(BaseModel):
    class_name: str | None = Field(default=None, max_length=120)
    faculty: str | None = Field(default=None, max_length=120)
    major: str | None = Field(default=None, max_length=120)
    goal: str | None = Field(default=None, max_length=2000)
    avatar_url: str | None = Field(default=None, max_length=MAX_AVATAR_LEN)


class MeOut(BaseModel):
    user: UserOut
    profile: ProfileOut
```

- [ ] **Step 3: Verify import**

Run: `cd backend && python -c "from app.schemas.profile import MeOut; from app.schemas.auth import Token; print('ok')"`
Expected: `ok`

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/
git commit -m "feat(backend): add auth + profile Pydantic schemas"
```

## Task A3: Test harness (conftest)

**Files:** Create `backend/tests/conftest.py`

- [ ] **Step 1: Write `conftest.py`**

```python
"""Pytest fixtures: an isolated in-memory SQLite DB + a TestClient whose
`get_db` dependency is overridden to use it. No Postgres needed for unit/API
tests (CI `migrate-check` covers Postgres separately)."""

from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers User/Profile on Base.metadata)
from app.core.db import Base
from app.core.deps import get_db
from app.main import app


@pytest.fixture
def db_session() -> Iterator[Session]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    testing_session = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, expire_on_commit=False
    )
    session = testing_session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture
def client(db_session: Session) -> Iterator[TestClient]:
    def override_get_db() -> Iterator[Session]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
```

- [ ] **Step 2: Verify it loads (existing health test still passes)**

Run: `cd backend && python -m pytest tests/test_health.py -q`
Expected: PASS (conftest imports cleanly).

- [ ] **Step 3: Commit**

```bash
git add backend/tests/conftest.py
git commit -m "test(backend): SQLite test DB + TestClient fixtures"
```

## Task A4: Real `get_current_user`

**Files:** Modify `backend/app/core/deps.py`

- [ ] **Step 1: Replace the stub `get_current_user`**

Replace the entire stub function (the one that always raises 401) with:

```python
def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> "User":
    """Decode the bearer JWT and return the matching User, or 401."""
    from sqlalchemy import select

    from app.core.security import decode_access_token
    from app.models.user import User

    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_error
    payload = decode_access_token(token)
    if not payload:
        raise credentials_error
    email = payload.get("sub")
    if not email:
        raise credentials_error
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        raise credentials_error
    return user
```

(Imports are function-local to avoid import cycles at module load.)

- [ ] **Step 2: Verify import**

Run: `cd backend && python -c "from app.core.deps import get_current_user; print('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add backend/app/core/deps.py
git commit -m "feat(backend): implement JWT get_current_user"
```

## Task A5: Auth router (TDD)

**Files:** Create `backend/app/api/auth.py`, `backend/tests/test_auth.py`; Modify `backend/app/main.py`

- [ ] **Step 1: Write the failing tests**

`backend/tests/test_auth.py`:

```python
"""Auth API tests."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User

REG = {"email": "demo@studytrack.app", "password": "secret123", "name": "Demo"}


def _register(client: TestClient, **over) -> dict:
    return client.post("/api/auth/register", json={**REG, **over}).json()


def test_register_returns_token(client: TestClient) -> None:
    resp = client.post("/api/auth/register", json=REG)
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_register_duplicate_email_conflicts(client: TestClient) -> None:
    client.post("/api/auth/register", json=REG)
    resp = client.post("/api/auth/register", json=REG)
    assert resp.status_code == 409


def test_password_is_hashed_not_plaintext(client: TestClient, db_session: Session) -> None:
    client.post("/api/auth/register", json=REG)
    user = db_session.scalar(select(User).where(User.email == REG["email"]))
    assert user is not None
    assert user.password_hash != REG["password"]
    assert user.password_hash.startswith("$argon2")


def test_login_success(client: TestClient) -> None:
    client.post("/api/auth/register", json=REG)
    resp = client.post(
        "/api/auth/login",
        data={"username": REG["email"], "password": REG["password"]},
    )
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_login_wrong_password_401(client: TestClient) -> None:
    client.post("/api/auth/register", json=REG)
    resp = client.post(
        "/api/auth/login",
        data={"username": REG["email"], "password": "wrong"},
    )
    assert resp.status_code == 401


def test_login_unknown_email_401(client: TestClient) -> None:
    resp = client.post(
        "/api/auth/login",
        data={"username": "nobody@x.com", "password": "secret123"},
    )
    assert resp.status_code == 401


def test_me_requires_auth(client: TestClient) -> None:
    assert client.get("/api/auth/me").status_code == 401


def test_me_returns_user_and_profile(client: TestClient) -> None:
    token = _register(client)["access_token"]
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["email"] == REG["email"]
    assert body["user"]["lang"] == "vi"
    assert body["user"]["theme"] == "dark"
    assert body["profile"]["class_name"] == ""


def test_patch_me_updates_settings(client: TestClient) -> None:
    token = _register(client)["access_token"]
    resp = client.patch(
        "/api/auth/me",
        json={"lang": "en", "theme": "light", "name": "New Name"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["lang"] == "en"
    assert body["theme"] == "light"
    assert body["name"] == "New Name"
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd backend && python -m pytest tests/test_auth.py -q`
Expected: FAIL (404s — router not mounted yet).

- [ ] **Step 3: Write `auth.py`**

```python
"""Auth router: register, login, current-user (get + settings patch)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.profile import Profile
from app.models.user import User
from app.schemas.auth import Token, UserOut, UserRegister, UserSettingsUpdate
from app.schemas.profile import MeOut, ProfileOut

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)) -> Token:
    if db.scalar(select(User).where(User.email == data.email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        profile=Profile(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return Token(access_token=create_access_token(user.email))


@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    user = db.scalar(select(User).where(User.email == form.username))
    if user is None or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user.email))


@router.get("/me", response_model=MeOut)
def read_me(current: User = Depends(get_current_user)) -> MeOut:
    return MeOut(
        user=UserOut.model_validate(current),
        profile=ProfileOut.model_validate(current.profile),
    )


@router.patch("/me", response_model=UserOut)
def update_me(
    data: UserSettingsUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    if data.name is not None:
        current.name = data.name
    if data.lang is not None:
        current.lang = data.lang
    if data.theme is not None:
        current.theme = data.theme
    db.commit()
    db.refresh(current)
    return UserOut.model_validate(current)
```

- [ ] **Step 4: Mount the router in `main.py`**

In `backend/app/main.py`, add the import near `from app.api import health`:

```python
from app.api import auth, health
```

And below `app.include_router(health.router, prefix="/api")` add:

```python
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `cd backend && python -m pytest tests/test_auth.py -q`
Expected: PASS (9 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/auth.py backend/app/main.py backend/tests/test_auth.py
git commit -m "feat(backend): auth router (register/login/me) + tests"
```

## Task A6: Profile router (TDD)

**Files:** Create `backend/app/api/profile.py`, `backend/tests/test_profile.py`; Modify `backend/app/main.py`

- [ ] **Step 1: Write the failing tests**

`backend/tests/test_profile.py`:

```python
"""Profile API tests."""

from __future__ import annotations

from fastapi.testclient import TestClient

REG = {"email": "p@studytrack.app", "password": "secret123", "name": "Pat"}


def _auth(client: TestClient) -> dict:
    token = client.post("/api/auth/register", json=REG).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_profile_defaults(client: TestClient) -> None:
    resp = client.get("/api/profile", headers=_auth(client))
    assert resp.status_code == 200
    body = resp.json()
    assert body["class_name"] == ""
    assert body["avatar_url"] is None
    assert body["target_cpa"] is None


def test_put_profile_updates_identity(client: TestClient) -> None:
    headers = _auth(client)
    resp = client.put(
        "/api/profile",
        json={"class_name": "K65-CNTT", "faculty": "CNTT", "major": "KHMT", "goal": "Top 1"},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["class_name"] == "K65-CNTT"
    assert body["major"] == "KHMT"


def test_put_profile_partial_keeps_others(client: TestClient) -> None:
    headers = _auth(client)
    client.put("/api/profile", json={"faculty": "CNTT"}, headers=headers)
    resp = client.put("/api/profile", json={"major": "KHMT"}, headers=headers)
    assert resp.json()["faculty"] == "CNTT"
    assert resp.json()["major"] == "KHMT"


def test_profile_requires_auth(client: TestClient) -> None:
    assert client.get("/api/profile").status_code == 401
    assert client.put("/api/profile", json={"major": "X"}).status_code == 401
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd backend && python -m pytest tests/test_profile.py -q`
Expected: FAIL (404 — router not mounted).

- [ ] **Step 3: Write `profile.py`**

```python
"""Profile router: read + update the current user's profile."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.profile import ProfileOut, ProfileUpdate

router = APIRouter()


@router.get("", response_model=ProfileOut)
def read_profile(current: User = Depends(get_current_user)) -> ProfileOut:
    return ProfileOut.model_validate(current.profile)


@router.put("", response_model=ProfileOut)
def update_profile(
    data: ProfileUpdate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileOut:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current.profile, field, value)
    db.commit()
    db.refresh(current.profile)
    return ProfileOut.model_validate(current.profile)
```

- [ ] **Step 4: Mount the router in `main.py`**

Update the import to `from app.api import auth, health, profile` and add:

```python
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
```

- [ ] **Step 5: Run the full backend suite**

Run: `cd backend && python -m pytest -q`
Expected: PASS (health + auth + profile, ~15 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/profile.py backend/app/main.py backend/tests/test_profile.py
git commit -m "feat(backend): profile router (get/put) + tests"
```

## Task A7: Alembic migration

**Files:** Create `backend/alembic/versions/0001_user_profile.py`

> Preferred path: autogenerate against dev Postgres. Fallback (no Docker): use the hand-written migration below verbatim — it matches the models exactly.

- [ ] **Step 1 (preferred): Autogenerate**

Run:
```bash
docker compose up -d db
cd backend && alembic revision --autogenerate -m "user and profile"
```
Then open the generated file and confirm it creates `users` + `profiles` with the columns from Task A1. If Docker is unavailable, skip to Step 2.

- [ ] **Step 2 (fallback): Hand-write `0001_user_profile.py`**

```python
"""user and profile

Revision ID: 0001_user_profile
Revises:
Create Date: 2026-06-06
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

revision = "0001_user_profile"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("lang", sa.String(length=8), nullable=False, server_default="vi"),
        sa.Column("theme", sa.String(length=8), nullable=False, server_default="dark"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("class_name", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("faculty", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("major", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("goal", sa.Text(), nullable=False, server_default=""),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column("target_cpa", sa.Float(), nullable=True),
        sa.Column("total_credits_required", sa.Integer(), nullable=True),
        sa.Column("expected_graduation", sa.String(length=32), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("profiles")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
```

- [ ] **Step 3: Verify upgrade + drift gate (needs Postgres)**

Run:
```bash
docker compose up -d db
cd backend && alembic upgrade head && alembic check
```
Expected: upgrade succeeds; `alembic check` reports **no new upgrade operations** (models match migration). If Docker is unavailable in this environment, report this step as SKIPPED (CI will run it) — do not claim it passed.

- [ ] **Step 4: Commit**

```bash
git add backend/alembic/versions/0001_user_profile.py
git commit -m "feat(backend): alembic migration for users + profiles"
```

## Task A8: Seed demo user

**Files:** Modify `backend/seed.py`

- [ ] **Step 1: Replace the no-op `seed()`**

```python
"""Demo-data seeder. Run with: python seed.py"""

from __future__ import annotations

from sqlalchemy import select

import app.models  # noqa: F401  (register models on Base.metadata)
from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.profile import Profile
from app.models.user import User

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
```

- [ ] **Step 2: Verify (needs Postgres) or syntax-check**

Run: `cd backend && python -c "import seed; print('ok')"`
Expected: `ok`. Full run (`make seed`) requires the dev DB migrated; run it if Docker is available, else note SKIPPED.

- [ ] **Step 3: Commit**

```bash
git add backend/seed.py
git commit -m "feat(backend): seed a demo user + profile"
```

## Task A9: Lint + full backend green

- [ ] **Step 1: Lint/format**

Run: `cd backend && ruff check . && black --check . && ruff check --select I .`
Expected: all clean. (Fix with `ruff check --fix . && black .` if needed, then re-commit.)

- [ ] **Step 2: Full suite**

Run: `cd backend && python -m pytest -q`
Expected: PASS, no failures.

- [ ] **Step 3: Commit any fixups**

```bash
git add -A backend && git commit -m "chore(backend): lint/format pass" || echo "nothing to fix"
```

---

# WAVE B — Frontend (owner: `frontend-engineer`; gen-types step: `devops-engineer`)

> Read skill `.claude/skills/studytrack-frontend/SKILL.md` first. Run FE commands from `frontend/`. **Wave B depends on Wave A** (the OpenAPI schema must exist for `gen-types`).

## Task B0: Regenerate API types (`devops-engineer`)

**Files:** Modify `frontend/src/lib/api-types.ts` (generated)

- [ ] **Step 1: Generate**

Run (from repo root): `make gen-types`
Expected: `frontend/src/lib/api-types.ts` is overwritten with real types; it contains `components` with `schemas` `Token`, `UserOut`, `ProfileOut`, `MeOut`, `UserRegister`, `UserSettingsUpdate`, `ProfileUpdate`.
If `make gen-types` cannot boot the backend in this environment, generate manually:
```bash
cd backend && python -c "import json, app.main; print(json.dumps(app.main.app.openapi()))" > /tmp/openapi.json
cd frontend && npx openapi-typescript /tmp/openapi.json -o src/lib/api-types.ts
```

- [ ] **Step 2: Verify the expected schemas exist**

Run: `cd frontend && grep -E "Token|MeOut|ProfileOut|UserOut" src/lib/api-types.ts | head`
Expected: matches for each schema name.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api-types.ts
git commit -m "chore(frontend): regenerate api-types from OpenAPI (phase 1)"
```

## Task B1: Add `@hookform/resolvers`

**Files:** Modify `frontend/package.json` (+ lockfile)

- [ ] **Step 1: Install**

Run: `cd frontend && npm install @hookform/resolvers`
Expected: adds the dep + updates `package-lock.json` (CI `npm ci` needs the lockfile committed).

- [ ] **Step 2: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "build(frontend): add @hookform/resolvers for RHF+zod"
```

## Task B2: Typed contract re-exports

**Files:** Create `frontend/src/features/auth/types.ts`

- [ ] **Step 1: Write `types.ts`**

```typescript
/** Ergonomic aliases over the generated OpenAPI types (single source of truth). */
import type { components } from '@/lib/api-types';

type Schemas = components['schemas'];

export type Token = Schemas['Token'];
export type UserOut = Schemas['UserOut'];
export type ProfileOut = Schemas['ProfileOut'];
export type MeOut = Schemas['MeOut'];
export type UserRegister = Schemas['UserRegister'];
export type UserSettingsUpdate = Schemas['UserSettingsUpdate'];
export type ProfileUpdate = Schemas['ProfileUpdate'];
```

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors referencing `types.ts`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/auth/types.ts
git commit -m "feat(frontend): typed auth contract re-exports"
```

## Task B3: apiClient — Bearer token, 401 handling, form POST

**Files:** Modify `frontend/src/lib/apiClient.ts`

- [ ] **Step 1: Add token storage + auth header + 401 logout + `postForm`**

Add near the top (after `BASE_URL`):

```typescript
export const TOKEN_STORAGE_KEY = 'track_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}
```

In `request()`, build the Authorization header and handle 401 only when a token was sent. Replace the `init` headers block and the `if (!res.ok)` block:

```typescript
  const token = getToken();
  const init: RequestInit = {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };
```

(Remove the `credentials: 'include'` line — we use bearer tokens, not cookies.)

After computing `payload`, before throwing:

```typescript
  if (!res.ok) {
    if (res.status === 401 && token) {
      setToken(null);
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    const message =
      (payload && typeof payload === 'object' && 'detail' in payload
        ? String((payload as { detail: unknown }).detail)
        : res.statusText) || 'Request failed';
    throw new ApiError(res.status, message, payload);
  }
```

Add a `postForm` helper to the exported `apiClient` object (login uses form-urlencoded):

```typescript
  postForm: <T>(path: string, form: Record<string, string>) => {
    const body = new URLSearchParams(form).toString();
    return request<T>(path, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    } as ApiRequestOptions & { body: string });
  },
```

> Note: `request`'s `ApiRequestOptions` omits `body`; for `postForm`, pass `body` through by widening the call as shown (or add an internal `rawBody` option). Ensure `request` forwards `rest.body` when present — it already spreads `...rest` into `init`, so `body` passes through. Keep the `json` path untouched.

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/apiClient.ts
git commit -m "feat(frontend): bearer-token auth + 401 handling + form POST"
```

## Task B4: Auth store (Zustand) — TDD

**Files:** Create `frontend/src/store/authStore.ts`, `frontend/src/store/authStore.test.ts`

- [ ] **Step 1: Write the failing test**

`authStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { TOKEN_STORAGE_KEY } from '@/lib/apiClient';

describe('authStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({ token: null, user: null });
  });

  it('setSession stores the token in localStorage and marks authenticated', () => {
    useAuthStore.getState().setSession('jwt-abc');
    expect(useAuthStore.getState().token).toBe('jwt-abc');
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('jwt-abc');
  });

  it('logout clears token + user from store and localStorage', () => {
    useAuthStore.getState().setSession('jwt-abc');
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd frontend && npx vitest run src/store/authStore.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `authStore.ts`**

```typescript
/**
 * Auth store — token + current user (Zustand). Token persists to localStorage
 * via apiClient's setToken/getToken. On login the server-stored lang/theme are
 * applied (cross-device sync); see hooks.ts loadMe.
 */
import { create } from 'zustand';
import { getToken, setToken } from '@/lib/apiClient';
import type { MeOut } from '@/features/auth/types';

interface AuthState {
  token: string | null;
  user: MeOut | null;
  setSession: (token: string) => void;
  setUser: (me: MeOut | null) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getToken(),
  user: null,
  setSession: (token) => {
    setToken(token);
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    setToken(null);
    set({ token: null, user: null });
  },
  isAuthenticated: () => get().token !== null,
}));
```

- [ ] **Step 4: Run, verify pass**

Run: `cd frontend && npx vitest run src/store/authStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/store/authStore.ts frontend/src/store/authStore.test.ts
git commit -m "feat(frontend): auth store + tests"
```

## Task B5: Auth feature hooks

**Files:** Create `frontend/src/features/auth/hooks.ts`

- [ ] **Step 1: Write `hooks.ts`**

```typescript
/** TanStack Query hooks for auth + profile. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { applyTheme, type Theme } from '@/lib/theme';
import { setLanguage, type Lang } from '@/lib/i18n';
import { useAuthStore } from '@/store/authStore';
import type {
  MeOut,
  ProfileOut,
  ProfileUpdate,
  Token,
  UserOut,
  UserSettingsUpdate,
} from './types';

export const ME_KEY = ['auth', 'me'] as const;

/** Apply server-stored lang/theme to the client (cross-device sync). */
function applyServerPrefs(user: UserOut): void {
  applyTheme(user.theme as Theme);
  setLanguage(user.lang as Lang);
}

export function useMe() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ME_KEY,
    enabled: token !== null,
    queryFn: async () => {
      const me = await apiClient.get<MeOut>('/api/auth/me');
      setUser(me);
      applyServerPrefs(me.user);
      return me;
    },
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) =>
      apiClient.postForm<Token>('/api/auth/login', {
        username: vars.email,
        password: vars.password,
      }),
    onSuccess: (token) => {
      setSession(token.access_token);
      void qc.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { email: string; password: string; name: string }) =>
      apiClient.post<Token>('/api/auth/register', vars),
    onSuccess: (token) => {
      setSession(token.access_token);
      void qc.invalidateQueries({ queryKey: ME_KEY });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdate) => apiClient.put<ProfileOut>('/api/profile', data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ME_KEY }),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserSettingsUpdate) => apiClient.patch<UserOut>('/api/auth/me', data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ME_KEY }),
  });
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/features/auth/hooks.ts
git commit -m "feat(frontend): auth + profile query hooks"
```

## Task B6: shadcn Input + Label primitives

**Files:** Create `frontend/src/components/ui/input.tsx`, `frontend/src/components/ui/label.tsx`

- [ ] **Step 1: Write `input.tsx`**

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-token border border-border bg-input-bg px-3 py-2 text-sm text-text-helper',
        'placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
```

- [ ] **Step 2: Write `label.tsx`**

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium text-text-main', className)}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
```

- [ ] **Step 3: Type-check + commit**

Run: `cd frontend && npx tsc --noEmit` (expect clean)
```bash
git add frontend/src/components/ui/input.tsx frontend/src/components/ui/label.tsx
git commit -m "feat(frontend): Input + Label ui primitives"
```

## Task B7: AuthForm (shared login/register) — TDD

**Files:** Create `frontend/src/components/auth/AuthForm.tsx`, `frontend/src/components/auth/AuthForm.test.tsx`

- [ ] **Step 1: Write the failing test**

`AuthForm.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { AuthForm } from './AuthForm';

function renderForm(mode: 'login' | 'register', onSubmit = vi.fn()) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AuthForm mode={mode} onSubmit={onSubmit} pending={false} />
    </I18nextProvider>,
  );
}

describe('AuthForm', () => {
  it('shows a name field only in register mode', () => {
    const { rerender } = renderForm('login');
    expect(screen.queryByLabelText(/name|họ tên/i)).toBeNull();
    rerender(
      <I18nextProvider i18n={i18n}>
        <AuthForm mode="register" onSubmit={vi.fn()} pending={false} />
      </I18nextProvider>,
    );
    expect(screen.getByLabelText(/name|họ tên/i)).toBeInTheDocument();
  });

  it('validates email + password before submitting', async () => {
    const onSubmit = vi.fn();
    renderForm('login', onSubmit);
    fireEvent.click(screen.getByRole('button', { name: /login|đăng nhập/i }));
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd frontend && npx vitest run src/components/auth/AuthForm.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `AuthForm.tsx`**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
});
export type AuthFormValues = z.infer<typeof schema>;

interface AuthFormProps {
  mode: 'login' | 'register';
  pending: boolean;
  error?: string | null;
  onSubmit: (values: AuthFormValues) => void;
}

export function AuthForm({ mode, pending, error, onSubmit }: AuthFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormValues>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {mode === 'register' && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">{t('auth.name')}</Label>
          <Input id="name" {...register('name', { required: mode === 'register' })} />
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <span className="text-sm text-red-400">{t('auth.invalidEmail')}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t('auth.password')}</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && (
          <span className="text-sm text-red-400">{t('auth.passwordTooShort')}</span>
        )}
      </div>
      {error && <span className="text-sm text-red-400">{error}</span>}
      <Button type="submit" disabled={pending}>
        {mode === 'login' ? t('auth.login') : t('auth.register')}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `cd frontend && npx vitest run src/components/auth/AuthForm.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/auth/AuthForm.tsx frontend/src/components/auth/AuthForm.test.tsx
git commit -m "feat(frontend): shared AuthForm + tests"
```

## Task B8: Login + Register pages

**Files:** Create `frontend/src/pages/Login.tsx`, `frontend/src/pages/Register.tsx`

- [ ] **Step 1: Write `Login.tsx`**

```typescript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthForm, type AuthFormValues } from '@/components/auth/AuthForm';
import { useLogin } from '@/features/auth/hooks';
import { ApiError } from '@/lib/apiClient';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (values: AuthFormValues) => {
    setError(null);
    login.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: () => navigate('/dashboard', { replace: true }),
        onError: (e) => setError(e instanceof ApiError ? e.message : t('auth.genericError')),
      },
    );
  };

  return (
    <AuthShell title={t('auth.loginTitle')}>
      <AuthForm mode="login" pending={login.isPending} error={error} onSubmit={onSubmit} />
      <p className="mt-4 text-sm text-text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-semibold text-accent">
          {t('auth.register')}
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-bg-main p-6">
      <div className="w-full max-w-md rounded-card border border-border bg-bg-card p-8 shadow-card">
        <h1 className="mb-6 text-2xl font-bold text-text-helper">{title}</h1>
        {children}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Write `Register.tsx`**

```typescript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthForm, type AuthFormValues } from '@/components/auth/AuthForm';
import { AuthShell } from '@/pages/Login';
import { useRegister } from '@/features/auth/hooks';
import { ApiError } from '@/lib/apiClient';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const registerMut = useRegister();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (values: AuthFormValues) => {
    setError(null);
    registerMut.mutate(
      { email: values.email, password: values.password, name: values.name ?? '' },
      {
        onSuccess: () => navigate('/dashboard', { replace: true }),
        onError: (e) => setError(e instanceof ApiError ? e.message : t('auth.genericError')),
      },
    );
  };

  return (
    <AuthShell title={t('auth.registerTitle')}>
      <AuthForm mode="register" pending={registerMut.isPending} error={error} onSubmit={onSubmit} />
      <p className="mt-4 text-sm text-text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-accent">
          {t('auth.login')}
        </Link>
      </p>
    </AuthShell>
  );
}
```

- [ ] **Step 3: Type-check + commit**

Run: `cd frontend && npx tsc --noEmit` (expect clean)
```bash
git add frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx
git commit -m "feat(frontend): login + register pages"
```

## Task B9: RequireAuth guard — TDD

**Files:** Create `frontend/src/components/auth/RequireAuth.tsx`, `frontend/src/components/auth/RequireAuth.test.tsx`

- [ ] **Step 1: Write the failing test**

`RequireAuth.test.tsx`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireAuth } from './RequireAuth';
import { useAuthStore } from '@/store/authStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<div>DASH</div>} />
        </Route>
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null }));

  it('redirects to /login when unauthenticated', () => {
    renderAt('/dashboard');
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('renders the protected route when authenticated', () => {
    useAuthStore.setState({ token: 'jwt' });
    renderAt('/dashboard');
    expect(screen.getByText('DASH')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd frontend && npx vitest run src/components/auth/RequireAuth.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `RequireAuth.tsx`**

```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/** Gate protected routes: unauthenticated users go to /login. */
export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.token !== null);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
```

- [ ] **Step 4: Run, verify pass**

Run: `cd frontend && npx vitest run src/components/auth/RequireAuth.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/auth/RequireAuth.tsx frontend/src/components/auth/RequireAuth.test.tsx
git commit -m "feat(frontend): RequireAuth route guard + tests"
```

## Task B10: StudentIdCard — TDD

**Files:** Create `frontend/src/components/StudentIdCard.tsx`, `frontend/src/components/StudentIdCard.test.tsx`

- [ ] **Step 1: Write the failing test**

`StudentIdCard.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StudentIdCard } from './StudentIdCard';

describe('StudentIdCard', () => {
  it('renders name (uppercased), class, and major', () => {
    render(<StudentIdCard name="Pat Nguyen" className="K65" major="KHMT" avatarUrl={null} />);
    expect(screen.getByText('PAT NGUYEN')).toBeInTheDocument();
    expect(screen.getByText(/K65/)).toBeInTheDocument();
    expect(screen.getByText(/KHMT/)).toBeInTheDocument();
  });

  it('renders an avatar image when provided', () => {
    render(
      <StudentIdCard name="A" className="" major="" avatarUrl="data:image/png;base64,xxx" />,
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,xxx');
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `cd frontend && npx vitest run src/components/StudentIdCard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Write `StudentIdCard.tsx`**

```typescript
import { useTranslation } from 'react-i18next';

interface StudentIdCardProps {
  name: string;
  className: string;
  major: string;
  avatarUrl: string | null;
}

/** Port of the legacy `.student-id-card`. Gradient + text use theme tokens. */
export function StudentIdCard({ name, className, major, avatarUrl }: StudentIdCardProps) {
  const { t } = useTranslation();
  return (
    <div className="flex h-60 flex-col justify-between rounded-card border border-white/15 bg-id-card p-6 text-id-card-text">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold tracking-widest">STUDENT CARD</span>
        <span className="h-6 w-9 rounded-md bg-yellow-300/80" aria-hidden />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/20 text-3xl">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>👨‍💻</span>
          )}
        </div>
        <div className="min-w-0">
          {/* Uppercase in JS so textContent matches (CSS uppercase is visual-only). */}
          <div className="truncate text-lg font-semibold">{(name || 'STUDENT NAME').toUpperCase()}</div>
          <div className="text-sm opacity-90">
            {t('studentId.class')}: {className || '...'}
          </div>
          <div className="text-sm opacity-90">
            {t('studentId.major')}: {major || '...'}
          </div>
        </div>
      </div>
      <div className="flex justify-between text-xs opacity-80">
        <span>SYSTEM: STUDYTRACK</span>
        <span>STATUS: ACTIVE</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run, verify pass**

Run: `cd frontend && npx vitest run src/components/StudentIdCard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/StudentIdCard.tsx frontend/src/components/StudentIdCard.test.tsx
git commit -m "feat(frontend): StudentIdCard + tests"
```

## Task B11: Profile page (edit + live card)

**Files:** Create `frontend/src/pages/Profile.tsx`

- [ ] **Step 1: Write `Profile.tsx`**

```typescript
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StudentIdCard } from '@/components/StudentIdCard';
import { useMe, useUpdateProfile, useUpdateSettings } from '@/features/auth/hooks';

interface ProfileFormValues {
  name: string;
  class_name: string;
  faculty: string;
  major: string;
  goal: string;
  avatar_url: string | null;
}

export default function Profile() {
  const { t } = useTranslation();
  const me = useMe();
  const updateProfile = useUpdateProfile();
  const updateSettings = useUpdateSettings();
  const { register, handleSubmit, reset, watch, setValue } = useForm<ProfileFormValues>({
    defaultValues: {
      name: '',
      class_name: '',
      faculty: '',
      major: '',
      goal: '',
      avatar_url: null,
    },
  });

  useEffect(() => {
    if (me.data) {
      reset({
        name: me.data.user.name,
        class_name: me.data.profile.class_name,
        faculty: me.data.profile.faculty,
        major: me.data.profile.major,
        goal: me.data.profile.goal,
        avatar_url: me.data.profile.avatar_url,
      });
    }
  }, [me.data, reset]);

  const values = watch();

  const onAvatar = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setValue('avatar_url', String(reader.result));
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: ProfileFormValues) => {
    // name lives on User (settings); identity fields live on Profile.
    updateSettings.mutate({ name: data.name });
    updateProfile.mutate({
      class_name: data.class_name,
      faculty: data.faculty,
      major: data.major,
      goal: data.goal,
      avatar_url: data.avatar_url,
    });
  };

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-6 py-10 md:grid-cols-2">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-text-main">{t('profile.title')}</h1>
        <Field label={t('profile.name')} id="name">
          <Input id="name" {...register('name')} />
        </Field>
        <Field label={t('profile.class')} id="class_name">
          <Input id="class_name" {...register('class_name')} />
        </Field>
        <Field label={t('profile.faculty')} id="faculty">
          <Input id="faculty" {...register('faculty')} />
        </Field>
        <Field label={t('profile.major')} id="major">
          <Input id="major" {...register('major')} />
        </Field>
        <Field label={t('profile.goal')} id="goal">
          <Input id="goal" {...register('goal')} />
        </Field>
        <Field label={t('profile.avatar')} id="avatar">
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => onAvatar(e.target.files?.[0])}
          />
        </Field>
        <Button type="submit" disabled={updateProfile.isPending || updateSettings.isPending}>
          {t('profile.save')}
        </Button>
      </form>

      <div className="md:pt-12">
        <StudentIdCard
          name={values.name}
          className={values.class_name}
          major={values.major}
          avatarUrl={values.avatar_url}
        />
      </div>
    </main>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
```

> Note: `name` lives on `User` and is persisted via `PATCH /api/auth/me` (`useUpdateSettings`); the identity fields (`class_name`, `faculty`, `major`, `goal`, `avatar_url`) live on `Profile` and are persisted via `PUT /api/profile` (`useUpdateProfile`). `onSubmit` fires both. Both invalidate the `me` query so the reload-persists check passes.

- [ ] **Step 2: Type-check + commit**

Run: `cd frontend && npx tsc --noEmit` (expect clean)
```bash
git add frontend/src/pages/Profile.tsx
git commit -m "feat(frontend): profile page with live student-ID card"
```

## Task B12: Routing + guarded shell

**Files:** Modify `frontend/src/App.tsx`

- [ ] **Step 1: Rewrite `App.tsx`**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.token !== null);
  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
```

- [ ] **Step 2: Load `/me` on boot (theme/lang sync)**

`useMe` is `enabled: token !== null`, so it auto-fetches when a stored token exists and applies the server's `lang`/`theme`. Mount it once by calling it at the top of the `App()` body. Add the import `import { useMe } from '@/features/auth/hooks';` and, as the first line inside `App()`:

```typescript
  // Hydrate current user (applies server lang/theme) when a token is present.
  useMe();
```

- [ ] **Step 3: Type-check + run all FE tests**

Run: `cd frontend && npx tsc --noEmit && npx vitest run`
Expected: clean + all tests pass.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): guarded routing + /me hydration"
```

## Task B13: i18n keys (vi + en parity)

**Files:** Modify `frontend/src/locales/vi.json`, `frontend/src/locales/en.json`

- [ ] **Step 1: Add `auth`, `profile`, `studentId` groups to `vi.json`**

Merge these keys (keep existing keys):

```json
  "auth": {
    "loginTitle": "Đăng nhập StudyTrack",
    "registerTitle": "Tạo tài khoản",
    "name": "Họ tên",
    "email": "Email",
    "password": "Mật khẩu",
    "login": "Đăng nhập",
    "register": "Đăng ký",
    "noAccount": "Chưa có tài khoản?",
    "haveAccount": "Đã có tài khoản?",
    "invalidEmail": "Email không hợp lệ",
    "passwordTooShort": "Mật khẩu tối thiểu 6 ký tự",
    "genericError": "Đã có lỗi xảy ra, vui lòng thử lại"
  },
  "profile": {
    "title": "Hồ sơ cá nhân",
    "name": "Họ tên",
    "class": "Lớp",
    "faculty": "Khoa",
    "major": "Ngành",
    "goal": "Mục tiêu",
    "avatar": "Ảnh đại diện",
    "save": "Lưu hồ sơ"
  },
  "studentId": {
    "class": "Lớp",
    "major": "Ngành"
  }
```

- [ ] **Step 2: Add the same groups to `en.json`**

```json
  "auth": {
    "loginTitle": "Sign in to StudyTrack",
    "registerTitle": "Create an account",
    "name": "Full name",
    "email": "Email",
    "password": "Password",
    "login": "Login",
    "register": "Register",
    "noAccount": "No account yet?",
    "haveAccount": "Already have an account?",
    "invalidEmail": "Invalid email",
    "passwordTooShort": "Password must be at least 6 characters",
    "genericError": "Something went wrong, please try again"
  },
  "profile": {
    "title": "My Profile",
    "name": "Full name",
    "class": "Class",
    "faculty": "Faculty",
    "major": "Major",
    "goal": "Goal",
    "avatar": "Avatar",
    "save": "Save profile"
  },
  "studentId": {
    "class": "Class",
    "major": "Major"
  }
```

- [ ] **Step 3: Verify JSON parses + key parity**

Run: `cd frontend && node -e "const vi=require('./src/locales/vi.json'),en=require('./src/locales/en.json');const keys=o=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?Object.keys(v).map(x=>k+'.'+x):[k]);const a=keys(vi).sort(),b=keys(en).sort();console.log(JSON.stringify(a)===JSON.stringify(b)?'PARITY OK':'MISMATCH '+a.filter(x=>!b.includes(x)).concat(b.filter(x=>!a.includes(x))))"`
Expected: `PARITY OK`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/locales/vi.json frontend/src/locales/en.json
git commit -m "feat(frontend): i18n keys for auth/profile/studentId (vi+en)"
```

## Task B14: Frontend lint + full green

- [ ] **Step 1: Lint + format + tests + typecheck**

Run: `cd frontend && npm run lint && npm run format:check && npx tsc --noEmit && npx vitest run`
Expected: all clean/pass. Fix with `npm run format` + lint autofix as needed, then re-commit.

- [ ] **Step 2: Commit fixups**

```bash
git add -A frontend && git commit -m "chore(frontend): lint/format pass" || echo "nothing to fix"
```

---

# WAVE C — Integration / QA (owner: `qa-integrator`)

> Read skill `.claude/skills/studytrack-qa/SKILL.md`. Compare both sides of every interface; report evidence, never assert without output.

## Task C1: Contract + runtime verification

- [ ] **Step 1: Backend tests**

Run: `cd backend && python -m pytest -q`
Expected: all PASS. Paste the summary line.

- [ ] **Step 2: Frontend tests + typecheck + lint**

Run: `cd frontend && npx vitest run && npx tsc --noEmit && npm run lint`
Expected: all PASS/clean. Paste summaries.

- [ ] **Step 3: gen-types is in sync (no drift)**

Run: `make gen-types && git diff --exit-code frontend/src/lib/api-types.ts`
Expected: exit 0 (regenerating produces no diff — FE types match the live OpenAPI). If it differs, commit the regenerated file and flag that a hook/type was stale.

- [ ] **Step 4: Migration on a fresh DB (if Docker available)**

Run: `docker compose down -v && docker compose up -d db && cd backend && alembic upgrade head && alembic check`
Expected: clean upgrade + `alembic check` finds no pending ops. If no Docker, report SKIPPED (CI covers it).

- [ ] **Step 5: Contract cross-check (manual diff)**

Confirm each endpoint shape matches its hook + the generated type:
- `POST /api/auth/register` → `Token` ← `useRegister`
- `POST /api/auth/login` (form) → `Token` ← `useLogin` (uses `postForm`)
- `GET /api/auth/me` → `MeOut` ← `useMe`
- `PATCH /api/auth/me` → `UserOut` ← `useUpdateSettings`
- `GET/PUT /api/profile` → `ProfileOut` ← `useUpdateProfile`

Report PASS/FAIL with evidence per row.

## Task C2: E2E checklist (manual, if app boots)

> If `make dev` runs in this environment, walk this in **vi/en × light/dark**. Otherwise document it as the reviewer's manual checklist.

- [ ] Register → auto-login → lands on `/dashboard`
- [ ] Logout (clears token) → `/login`; protected `/profile` redirects to `/login`
- [ ] Login with demo user (`demo@studytrack.app` / `studytrack` after `make seed`)
- [ ] Edit profile fields → student-ID card updates live as you type
- [ ] Save profile → reload → values persist (loaded from server)
- [ ] Toggle theme + language while logged in → reload → choice persists (from server `lang`/`theme`)
- [ ] Repeat the visual checks in both languages and both themes

Report results / blockers.

---

# WAVE D — Docs (owner: `docs-keeper`)

> Read skill `.claude/skills/studytrack-docs/SKILL.md`. Run after QA is green.

## Task D1: Update docs for what shipped

**Files:** Modify `README.md`, `CLAUDE.md`, `CLAUDE-VIE.md`, `GEMINI.md`, `GEMINI-VIE.md`

- [ ] **Step 1: README.md (Vietnamese)** — add a Phase 1 section: auth flow (đăng ký/đăng nhập JWT), new endpoints table (`/api/auth/*`, `/api/profile`), demo login (`make seed` → `demo@studytrack.app` / `studytrack`), note token stored in `localStorage` (`track_token`), and mark Phase 1 status = done. No new env vars (JWT_SECRET already documented).

- [ ] **Step 2: CLAUDE.md (canonical EN)** — document: the auth architecture (argon2 + JWT bearer, 24h), token storage, the `User`/`Profile` models, the `class_name` naming note, the new routers, and that `get_current_user` is now real (not a stub). Update the "as-built map" with auth/profile functions.

- [ ] **Step 3: Mirror to CLAUDE-VIE.md, GEMINI.md, GEMINI-VIE.md** — keep them roughly consistent with CLAUDE.md's new conventions.

- [ ] **Step 4: Verify locale parity again** (same command as Task B13 Step 3) → `PARITY OK`.

- [ ] **Step 5: Commit**

```bash
git add README.md CLAUDE.md CLAUDE-VIE.md GEMINI.md GEMINI-VIE.md
git commit -m "docs(p1): document auth + user foundation (phase 1)"
```

---

# WAVE E — Review + finish (owner: orchestrator)

- [ ] **Step 1:** `superpowers:requesting-code-review` on the `feat/p1-auth` diff; address findings via `superpowers:receiving-code-review`.
- [ ] **Step 2:** `superpowers:verification-before-completion` — re-run `make test` (or the per-side commands) + lint + (if Docker) `alembic upgrade head` on a fresh DB; paste the green output.
- [ ] **Step 3:** `superpowers:finishing-a-development-branch` — squash the WIP commits, push (user-gated), open the PR; merge to `main` only with green CI (triggers auto-deploy). Confirm the `main` squash-commit version prefix with the user (Phase 1 = **minor** bump → likely `1.1.0 : ...`).
- [ ] **Step 4:** Smoke `/api/health` post-deploy; offer the user a harness feedback pass.

---

## Notes for the executor
- TDD is mandatory for backend routers/services (tests first, watch them fail, then implement).
- Commit after every green step (frequent commits). The branch is squashed at merge.
- If Docker/network is unavailable, mark Docker-dependent steps SKIPPED with the reason — never claim an unrun check passed (CI is the backstop).
- Keep `_workspace/` notes if cross-agent coordination is needed (gitignored).
