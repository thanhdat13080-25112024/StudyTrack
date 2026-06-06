---
name: studytrack-devops
description: How to build StudyTrack's workflow rails and deploy pipeline — dev docker-compose (Postgres), Makefile targets, pre-commit, .env.example, GitHub Actions CI (pytest+vitest+lint+migrate-check) and auto-SSH deploy, prod docker-compose (nginx+wss+certbot+FastAPI+Postgres), Alembic wiring, OpenAPI→TS gen-types, seed.py, branch protection, and pg_dump backup. Use whenever writing or changing CI/CD, Docker, nginx, Makefile, pre-commit, env, or deploy config for StudyTrack.
---

# StudyTrack DevOps Conventions

Lay all rails in Phase 0 so every later phase can test + auto-deploy. `main` must stay always-green and deployable; merges to `main` auto-deploy to the user's VPS.

## Targets (Phase 0 builds all of these)
```
.gitignore                      # root + per-package; keep the repo clean (see below)
docker-compose.yml              # dev: Postgres service (+ optional adminer)
Makefile                        # dev | test | migrate | seed | gen-types | deploy
.pre-commit-config.yaml         # ruff+black (BE), eslint+prettier (FE), block .env/secrets
.env.example                    # DATABASE_URL, JWT_SECRET (placeholders only)
.github/workflows/ci.yml        # test + lint + migrate-check (PR gate)
.github/workflows/deploy.yml    # push main -> ssh VPS -> deploy/deploy.sh
deploy/docker-compose.prod.yml  # nginx + backend(gunicorn+uvicorn) + db + certbot
deploy/nginx/default.conf       # domain + SSL + proxy /api + /ws (wss upgrade)
deploy/deploy.sh                # git pull -> compose up -d --build -> alembic upgrade head
```

## Makefile contract (the user's day-to-day commands)
- `make dev` — Postgres up (docker-compose) + backend `uvicorn --reload` + frontend `vite`.
- `make test` — `pytest` (backend) + `vitest run` (frontend).
- `make migrate` — `alembic upgrade head` (and a helper to autogenerate a revision).
- `make seed` — run `backend/seed.py` for demo data.
- `make gen-types` — boot the FastAPI app, dump OpenAPI, run `openapi-typescript` → `frontend/src/lib/api-types.ts`.
- `make deploy` — local trigger of `deploy/deploy.sh` (normally CI does this on merge).

## CI (`ci.yml`) — merge gate, must be green to merge
Three jobs on PR:
- **test:** `pytest` + `vitest run`.
- **lint:** `ruff check` + `black --check` (BE), `eslint` + `prettier --check` (FE).
- **migrate-check:** spin a Postgres service, `alembic upgrade head`; **fail if models changed without a matching migration** (autogenerate dry-run shows a non-empty diff). This catches Alembic drift.

## Deploy (`deploy.yml`)
Push to `main` → `appleboy/ssh-action` into the VPS → `deploy/deploy.sh`. Required GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`. nginx serves `/`→FE static build, `/api`→FastAPI, `/ws`→FastAPI with `Upgrade`/`Connection` headers for **wss**; certbot issues/renews Let's Encrypt for the domain.

## Keep git clean (.gitignore discipline) — user priority
Only source + config belong in git. Never commit generated, installed, or local-only files. The `.gitignore` (root, plus per-package as needed) must cover at least:
- **Python:** `__pycache__/`, `*.py[cod]`, `.venv/`, `venv/`, `*.egg-info/`, `.pytest_cache/`, `.ruff_cache/`, `.mypy_cache/`, `htmlcov/`, `.coverage`.
- **Node/Vite:** `node_modules/`, `dist/`, `build/`, `.vite/`, `*.tsbuildinfo`, `coverage/`, `.eslintcache`.
- **Env & secrets:** `.env`, `.env.*` (but **keep** `.env.example`), `*.pem`, `*.key`, secrets files, certbot live certs.
- **DB/data/backups:** local Postgres volumes, `*.sql` dumps, `*.sqlite`.
- **Editor/OS:** `.DS_Store`, `.idea/`, `*.swp`, and editor dirs (do not ignore `.claude/` — it is the committed harness; do ignore `.claude/settings.local.json`).
- **Harness workspace:** `_workspace/` (cross-agent scratch — never pushed).
- Anything large/binary not needed to build (keep `public/dom.mp3`, which is a real asset).
`api-types.ts` is generated but **committed** (so the FE builds without booting the BE) — do not ignore it; `make gen-types` keeps it fresh. Verify cleanliness with `git status --porcelain` and `git check-ignore` before any commit; pre-commit also blocks `.env`/secrets as a second line of defense.

## Secrets & safety
- **Never commit secrets.** `.env.example` holds placeholders only; pre-commit blocks committing `.env` and obvious secret patterns. CI secrets live in GitHub Secrets; VPS secrets in a server-side env file.
- **Don't perform real deploys or SSH to the VPS** unless the user explicitly asks and supplies access. Author the pipeline; the user/CI runs it.
- Validate locally where possible without side effects: `docker compose -f <file> config`, `pre-commit run --all-files` (if safe), `make` target dry-runs. State honestly what you could and couldn't run (no Docker daemon / no network → say so).

## Backup
A cron `pg_dump` on the VPS (document the crontab line; don't install it remotely yourself).

## Branch protection
Document the GitHub setting (protect `main`: require PR + green CI, no direct push). The user applies it in repo settings; provide the exact required-checks names from `ci.yml`.

## DoD (devops slice)
Files created/changed, local validation output pasted (or "could not run X because Y"), new Makefile commands listed, placeholders/secrets the user must fill enumerated. Hand to `qa-integrator`.
