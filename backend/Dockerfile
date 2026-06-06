# StudyTrack backend image.
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install dependencies first (better layer caching). Copy only the project
# metadata, then install the package so its dependencies resolve.
COPY pyproject.toml ./
COPY README.md ./
COPY app ./app
RUN pip install .

# Copy the rest (alembic, seed, tests, etc.).
COPY . .

EXPOSE 8000

# Gunicorn process manager driving uvicorn workers for the ASGI app.
# Override worker count via $WEB_CONCURRENCY in the environment.
CMD ["gunicorn", "app.main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "2", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
