# StudyTrack Backend

FastAPI + SQLAlchemy 2.0 + Alembic + Pydantic v2 backend for the StudyTrack
full-stack refactor. It is the **source of truth** for all academic logic
(GPA/CPA, roadmap, weak-subject, direction analysis).

> Phase 0 status: skeleton only — boots, exposes a health check, green test,
> working Alembic. Domain models/services arrive in later phases.

## Requirements
- Python 3.12+
- PostgreSQL (not required for the health check or tests)

## Local setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env   # then edit secrets
```

## Run the API

```bash
# Dev (reload):
uvicorn app.main:app --reload --port 8000

# Prod-style (matches the Docker CMD):
gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker \
  --workers 2 --bind 0.0.0.0:8000
```

- Health check: `GET http://localhost:8000/api/health` -> `{"status": "ok"}`
- OpenAPI schema: `http://localhost:8000/openapi.json` (used for `make gen-types`)
- Swagger UI: `http://localhost:8000/docs`

## Tests

```bash
pytest          # the health contract test passes without a database
```

## Migrations (Alembic)

`alembic/env.py` reads `DATABASE_URL` from settings and uses `Base.metadata`
as `target_metadata`. No migrations exist yet (no models).

```bash
alembic revision --autogenerate -m "message"   # after adding/changing a model
alembic upgrade head
```

## Lint / format

```bash
ruff check .
black .
```

## Docker

```bash
docker build -t studytrack-backend .
docker run -p 8000:8000 --env-file .env studytrack-backend
```
