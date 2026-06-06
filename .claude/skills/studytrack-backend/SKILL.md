---
name: studytrack-backend
description: How to build the StudyTrack FastAPI backend — repo structure, SQLAlchemy 2.0 models, Pydantic v2 schemas, the test-first services layer (GPA/CPA engine, roadmap topological sort, weak-subject, direction analysis, streak, suggestions), Alembic migration discipline, and argon2+JWT auth. Use whenever writing or changing backend/, models, schemas, routers, services, migrations, or auth for StudyTrack.
---

# StudyTrack Backend Conventions

The backend is the **source of truth** for all academic logic. Frontend mirrors (e.g. `gpa.ts`) are display-only. Build the services layer **test-first** (pytest) — its outputs are deterministic and high-value.

## Stack & layout
Python 3.12 · FastAPI · SQLAlchemy 2.0 (typed, `Mapped[...]`) · Alembic · Pydantic v2 · PostgreSQL · python-jose (JWT) · passlib[argon2] · pytest + httpx.

```
backend/
  app/
    main.py            # FastAPI app, mounts routers + /ws
    core/              # config (pydantic-settings), security (jwt+hash), db (session), deps
    models/            # SQLAlchemy: user, profile, semester, course, prerequisite,
                       #   enrollment(grade), session(log), schedule, deadline, notification
    schemas/           # Pydantic v2 request/response (camelCase out via alias if needed)
    api/               # routers: auth, profile, sessions, schedule, courses, semesters,
                       #   grades, gpa, roadmap, analysis, deadlines, notifications, ws, dashboard
    services/          # gpa_engine, roadmap_engine, weak_subject, direction_analysis,
                       #   streak, suggestions  ← PURE logic, fully unit-tested
  alembic/             # migrations (env.py wired to settings.DATABASE_URL)
  tests/               # pytest: tests/services/* (unit), tests/api/* (httpx client)
  seed.py              # demo data (owned with devops, but you provide the domain seed)
  pyproject.toml, Dockerfile
```

## Data model (target schema)
See the canonical schema in the plan and `CLAUDE.md`. Key relations: User 1–1 Profile; User 1–N Semester/Course/Enrollment/StudySession/ScheduleItem/Deadline/Notification; Course self-M2M Prerequisite; Enrollment links Course×Semester with grades. `StudySession.course_id` is **nullable** (links a focus session to a course, with `subject` text fallback). Badges stay **derived**, never stored.

## TDD workflow for services (mandatory)
Follow `superpowers:test-driven-development`. For each service function:
1. **Red** — write `tests/services/test_<name>.py` asserting the expected output for representative + edge inputs. Run pytest, see it fail.
2. **Green** — implement the minimum in `services/<name>.py` to pass.
3. **Refactor** — clean up with tests staying green.

### GPA engine (`gpa_engine.py`) — the canonical conversion (configurable)
Default Vietnamese table (`grade_10 → letter → grade_4`):
```
A : 8.5–10  → 4.0     B+: 8.0–8.4 → 3.5     B : 7.0–7.9 → 3.0
C+: 6.5–6.9 → 2.5     C : 5.5–6.4 → 2.0     D+: 5.0–5.4 → 1.5
D : 4.0–4.9 → 1.0     F : <4.0    → 0.0
```
- Semester GPA = Σ(grade_4 × credits) / Σ credits, grouped by `semester_id`.
- CPA = same, cumulative across passed/graded enrollments.
- Credits earned vs `total_credits_required`; classification (Xuất sắc ≥3.6 / Giỏi ≥3.2 / Khá ≥2.5 / TB ≥2.0 / Yếu) — **configurable** (pass the table/thresholds in, don't hardcode magic numbers in the formula).
- **What-if:** given current CPA + credits done + target → required average over remaining credits; report feasibility + scholarship/warning thresholds.

Other services: **roadmap_engine** = topological sort of remaining courses by `Prerequisite`, spread across semesters under a per-semester credit cap, respecting required-first + `expected_graduation`. **weak_subject** = rule-based flag combining low `grade_4` (≈D/F) OR abnormally low study-time-per-credit (via `StudySession.course_id`) OR failed prerequisite (low grade AND low hours = red). **direction_analysis** = cluster grades by `category` → strengths → elective suggestions; overload + missing-prereq warnings. **streak/suggestions** = port `updateStreakLogic` + `generateSmartSuggestion` from `legacy/index.html`.

## Conventions
- **Schemas:** Pydantic v2, `model_config` with `from_attributes=True`. Keep request/response shapes explicit and stable — they become the OpenAPI contract the frontend types are generated from. When you change a response shape, say so in your report so `gen-types` is re-run.
- **Routers:** thin — validate, call a service, return a schema. Business logic belongs in `services/`, never in the router.
- **Alembic:** every model change ⇒ `alembic revision --autogenerate` reviewed by hand + committed in the same change. Never mutate an applied migration.
- **Auth:** hash with argon2 (`passlib`), issue/verify JWT (python-jose). Dependencies in `core/deps.py` (`get_current_user`). No plaintext, ever — this is the explicit fix over the legacy app.
- **Config/secrets:** `pydantic-settings` reads from env; never hardcode DB URL or JWT secret.

## Definition of done (backend slice)
pytest green (paste summary), migration added if models changed, OpenAPI contract reported, no secret in code. Then hand to `qa-integrator`.
