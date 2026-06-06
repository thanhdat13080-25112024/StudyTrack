#!/usr/bin/env bash
# =============================================================================
# StudyTrack — production deploy script (runs ON the VPS)
# Invoked by .github/workflows/deploy.yml via appleboy/ssh-action on push to
# main, and runnable manually with `make deploy` from a checkout on the VPS.
#
# Flow:  git pull  ->  compose up -d --build  ->  alembic upgrade head
#
# Prereqs on the VPS:
#   - repo cloned (e.g. /opt/studytrack) and this branch checked out
#   - a server-side .env present at repo root (NOT in git) with prod secrets
#   - docker + docker compose plugin installed
# =============================================================================
set -euo pipefail

# Resolve repo root from this script's location (deploy/ -> repo root).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

COMPOSE_FILE="deploy/docker-compose.prod.yml"
BRANCH="${DEPLOY_BRANCH:-main}"

echo ">> [1/4] Updating source (branch: ${BRANCH})"
git fetch --all --prune
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

echo ">> [2/4] Building & starting containers"
docker compose -f "${COMPOSE_FILE}" up -d --build

echo ">> [3/4] Waiting for the database to be healthy"
# Give Postgres a moment; the backend container also waits via depends_on.
for i in $(seq 1 30); do
  if docker compose -f "${COMPOSE_FILE}" exec -T db pg_isready >/dev/null 2>&1; then
    echo "   db is ready"
    break
  fi
  sleep 2
done

echo ">> [4/4] Applying database migrations (alembic upgrade head)"
docker compose -f "${COMPOSE_FILE}" exec -T backend alembic upgrade head

echo ">> Deploy complete. Running containers:"
docker compose -f "${COMPOSE_FILE}" ps
