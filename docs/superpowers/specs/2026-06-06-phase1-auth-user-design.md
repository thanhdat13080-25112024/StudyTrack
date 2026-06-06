# Phase 1 — Auth + User Foundation — Design

**Date:** 2026-06-06
**Branch:** `feat/p1-auth`
**Status:** Approved (design); ready for implementation plan.

StudyTrack full-stack refactor, Phase 1. Builds the authentication layer and user
foundation on top of the Phase 0 scaffold: real argon2 + JWT auth, `User`/`Profile`
models + migration, auth/profile routers, and the frontend auth pages + virtual
student-ID card, with i18n (vi/en) and theme (light/dark) wired and synced to the
server. See the master plan at
`/Users/thanhdat/.claude/plans/hi-n-t-i-d-n-n-y-serialized-mist.md`.

## Locked decisions (from brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| JWT transport/storage | **Bearer header + `localStorage`** | Matches scaffold's `OAuth2PasswordBearer`; simplest for a self-hosted app. Single 24h access token, **no refresh token** (YAGNI). |
| Avatar storage | **Base64 data-URI in a DB text column** (`avatar_url`) | Matches legacy behavior, no file-serving infra, runs on the VPS immediately. Size cap ~500KB enforced. |
| Profile table scope | **Full table now, surface a subset** | One migration creates all plan columns; academic fields stay nullable/unused until Phase 3. Avoids later migration churn. |
| Lang/theme persistence | **Persist on `User`, hydrate on login** | `User.lang`/`User.theme` are the source of truth; FE hydrates on login and writes through on toggle. `localStorage` is the pre-login/offline default. Delivers cross-device sync cheaply. |
| Login encoding (tech A) | **`OAuth2PasswordRequestForm` (form-urlencoded)** | Keeps Swagger "Authorize" working out of the box + matches `OAuth2PasswordBearer`. FE sends form-encoded for login only; all other calls are JSON. |
| Auth page structure (tech B) | **Two routes `/login` + `/register`, shared `AuthForm`** | Clean routing; shared component preserves legacy UX. |

## Scope

**Backend:** `User` + `Profile` models, one Alembic migration, argon2 hashing, JWT,
`auth` + `profile` routers, a real `get_current_user` dependency (replacing the
Phase 0 stub), pytest coverage.
**Frontend:** Login/Register pages, Profile page (edit identity fields) + live virtual
student-ID card, `authStore` (Zustand) + token persistence, protected routing, i18n
vi/en + theme synced to server.
**DevOps:** `make gen-types` regenerates `api-types.ts`; migration green in CI.
**QA:** OpenAPI↔types↔hooks contract + E2E in vi/en × light/dark.
**Docs:** README + the four AI-instruction files + locale parity.

## Backend design

### Models (`backend/app/models/`)

`user.py` — **User**
- `id` int PK autoincrement
- `email` str, unique, indexed, not null
- `password_hash` str, not null (argon2)
- `name` str, not null
- `lang` str, default `'vi'`
- `theme` str, default `'dark'`
- `created_at` datetime(tz), server default now
- relationship: `profile` (1–1, `uselist=False`, cascade delete-orphan)

`profile.py` — **Profile**
- `id` int PK autoincrement
- `user_id` int FK → `user.id`, unique (enforces 1–1), not null
- Identity fields (surfaced in Phase 1 UI): `class_name` str default `''`, `faculty`
  str default `''`, `major` str default `''`, `goal` str default `''`,
  `avatar_url` Text nullable (holds base64 data-URI)
- Academic fields (nullable, unused until Phase 3): `target_cpa` float nullable,
  `total_credits_required` int nullable, `expected_graduation` str nullable

**Naming note:** the plan abbreviates the column as `class`; `class` is a Python
keyword, so the model attribute and JSON field are both `class_name`. Documented in
CLAUDE.md.

Both models register on `Base.metadata` via imports in `app/models/__init__.py`
(Alembic autogenerate depends on this).

### Schemas (`backend/app/schemas/`)

- `Token` — `{access_token: str, token_type: "bearer"}`
- `UserRegister` — `{email: EmailStr, password: str (min length), name: str}`
- `UserOut` — `{id, email, name, lang, theme, created_at}`
- `ProfileOut` — all profile fields (identity + academic)
- `ProfileUpdate` — identity fields editable (`class_name`, `faculty`, `major`,
  `goal`, `avatar_url`); academic fields accepted-optional but not surfaced in UI
- `UserSettingsUpdate` — `{name?, lang?, theme?}`
- `MeOut` — `{user: UserOut, profile: ProfileOut}`

`avatar_url` validation: reject payloads over ~500KB.

### Endpoints (mounted under `/api`)

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | JSON `UserRegister` | `Token` (auto-login) |
| POST | `/api/auth/login` | **form** `username`(=email), `password` | `Token` |
| GET | `/api/auth/me` | — | `MeOut` |
| PATCH | `/api/auth/me` | JSON `UserSettingsUpdate` | `UserOut` |
| GET | `/api/profile` | — | `ProfileOut` |
| PUT | `/api/profile` | JSON `ProfileUpdate` | `ProfileOut` |

Routers: `backend/app/api/auth.py` (register, login, me GET/PATCH) and
`backend/app/api/profile.py` (GET/PUT). Mounted in `app/main.py` with tags
`auth` / `profile`.

### Auth flow / security

- **register:** 409 if email already exists; else hash password, create `User` +
  default `Profile`, commit, issue token.
- **login:** load user by email; `verify_password`; 401 on bad password / unknown
  email; issue token.
- **`get_current_user`** (replaces Phase 0 stub in `core/deps.py`): decode JWT →
  `sub` (email) → load `User`; 401 if missing/invalid/expired. Uses the existing
  `security.decode_access_token` + `oauth2_scheme`.

### Tests (`backend/tests/`)

Use **SQLite in-memory** + `app.dependency_overrides[get_db]` (no Postgres needed
for pytest; CI `migrate-check` covers Postgres separately). `conftest.py` provides a
fresh DB + `TestClient` per test.

- `test_auth.py`: register → token; duplicate email → 409; login success; login
  wrong password → 401; login unknown email → 401; `/me` without token → 401;
  `/me` with token → user; **stored password is an argon2 hash, not plaintext**.
- `test_profile.py`: GET profile returns defaults; PUT updates identity fields;
  PATCH `/auth/me` updates `lang`/`theme`/`name`; unauthorized → 401.

### Migration / seed

- Autogenerate `user` + `profile` against dev Postgres (`docker compose up -d db`).
  If Docker is unavailable in the sandbox, hand-write a migration matching the
  models, then confirm with `alembic check`.
- `seed.py`: create one demo user (argon2-hashed, never plaintext) + profile for
  fast demo/login.

## Frontend design

### Structure (`frontend/src/`)

- `pages/Login.tsx`, `pages/Register.tsx` — routes `/login`, `/register`, both
  rendering a shared `components/auth/AuthForm.tsx` (react-hook-form + zod).
- `pages/Profile.tsx` — edit identity fields + live student-ID card (port of
  `syncCardRealtime`: card updates as you type).
- `components/StudentIdCard.tsx` — port of legacy `.student-id-card`: brand
  "STUDENT CARD", chip, avatar (base64 `img` / emoji fallback), uppercase name,
  class, major, footer `SYSTEM: STUDYTRACK · STATUS: ACTIVE`. Gradient via theme
  tokens (`--id-card-bg`: blue gradient dark / teal gradient light, from legacy)
  added to `tailwind.config` + `globals.css`.
- `components/auth/RequireAuth.tsx` — route guard: unauthenticated → `/login`;
  authenticated hitting `/login` → `/dashboard` (port of `renderSection` auth
  enforcement).
- `store/authStore.ts` (Zustand) — `token`, `user`, `isAuthenticated`; actions
  `login` / `register` / `logout` / `loadMe`; persists token to `localStorage`
  (`track_token`); theme/lang toggles while authenticated write through via
  `PATCH /api/auth/me`.
- `features/auth/` — TanStack Query hooks: `useLogin`, `useRegister`, `useMe`,
  `useUpdateProfile`, `useUpdateSettings`.
- `lib/apiClient.ts` — attach `Authorization: Bearer <token>`; **remove**
  `credentials:'include'`; on 401 clear token + redirect to `/login`.
- i18n: add `auth.*`, `profile.*`, `studentId.*` keys to `vi.json` + `en.json`
  (full parity).
- Theme/lang sync: boot from `localStorage` (pre-login); after `loadMe`, apply
  server `lang`/`theme` (override local) + persist; toggling while logged in →
  `PATCH /me`.

### Tests (vitest / RTL)

- `AuthForm` renders + shows validation errors
- `StudentIdCard` renders from props
- `authStore` login/logout sets/clears token + `localStorage`
- `RequireAuth` redirects when unauthenticated

## DevOps / QA / Docs

- **DevOps:** `make gen-types` regenerates `frontend/src/lib/api-types.ts` from
  OpenAPI; commit the migration; CI `migrate-check` (`alembic check`) green.
- **QA (integration gate):** OpenAPI ↔ `api-types.ts` ↔ hooks contract
  (register/login/me/profile/settings shapes match); runtime `pytest` + `vitest`
  green, `alembic upgrade head` on a fresh DB, `gen-types` produces no diff; E2E
  checklist in vi/en × light/dark — register → auto-login → dashboard; logout →
  login; edit profile → card updates live → reload persists (from server); toggle
  theme/lang while logged in → persists after reload; protected-route redirect.
- **Docs:** README (auth flow, new endpoints, Phase 1 status); CLAUDE.md + the
  three mirrors (auth architecture, token storage, models, `class_name` naming);
  locale vi/en parity.

## Out of scope (YAGNI)

Email verification, password reset, refresh tokens, file-upload avatars, social
login, rate limiting, admin.

## Core contract (the FE↔BE seam)

`Token{access_token, token_type}` · `UserOut{id,email,name,lang,theme,created_at}` ·
`ProfileOut{...identity + academic nullable}` · `MeOut{user, profile}`. This is the
source of `api-types.ts`; any change here requires `make gen-types`.
