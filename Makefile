# =============================================================================
# StudyTrack — developer command surface
# Day-to-day commands wrapping docker-compose (dev DB), the FastAPI backend
# (uvicorn + alembic), and the Vite frontend (vite + vitest).
#
# Assumes:
#   - .env exists at repo root (cp .env.example .env)
#   - backend/  is a Python project with a venv + alembic + app.main:app
#   - frontend/ is a Vite project (npm)
# These dirs are built by the backend/frontend agents in parallel; this
# Makefile is the contract they wire into.
# =============================================================================

# Tools (override on the CLI, e.g. `make dev PY=python3.12`)
COMPOSE        ?= docker compose
PY             ?= python
UVICORN        ?= uvicorn
ALEMBIC        ?= alembic
NPM            ?= npm
BACKEND_DIR    ?= backend
FRONTEND_DIR   ?= frontend
APP_MODULE     ?= app.main:app
API_PORT       ?= 8000
OPENAPI_URL    ?= http://localhost:$(API_PORT)/openapi.json
API_TYPES_OUT  ?= $(FRONTEND_DIR)/src/lib/api-types.ts

.DEFAULT_GOAL := help

.PHONY: help db-up db-down dev backend frontend test migrate migrate-rev \
        migrate-check seed gen-types deploy lint pre-commit clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

# --- Infra -------------------------------------------------------------------
db-up: ## Start the dev Postgres (docker-compose) and wait for healthy
	$(COMPOSE) up -d db

db-down: ## Stop the dev Postgres (keeps the named volume)
	$(COMPOSE) stop db

# --- Dev ---------------------------------------------------------------------
dev: db-up ## Dev DB + backend (uvicorn --reload) + frontend (vite), all together
	@echo ">> Starting backend on :$(API_PORT) and frontend (vite). Ctrl-C to stop."
	@trap 'kill 0' INT TERM; \
	( cd $(BACKEND_DIR) && $(UVICORN) $(APP_MODULE) --reload --port $(API_PORT) ) & \
	( cd $(FRONTEND_DIR) && $(NPM) run dev ) & \
	wait

backend: db-up ## Run only the backend (uvicorn --reload)
	cd $(BACKEND_DIR) && $(UVICORN) $(APP_MODULE) --reload --port $(API_PORT)

frontend: ## Run only the frontend (vite dev server)
	cd $(FRONTEND_DIR) && $(NPM) run dev

# --- Quality -----------------------------------------------------------------
test: ## Run backend (pytest) + frontend (vitest run)
	cd $(BACKEND_DIR) && $(PY) -m pytest
	cd $(FRONTEND_DIR) && $(NPM) run test -- --run

lint: ## Lint both packages (ruff/black --check, eslint/prettier --check)
	cd $(BACKEND_DIR) && ruff check . && black --check .
	cd $(FRONTEND_DIR) && $(NPM) run lint && $(NPM) run format:check

pre-commit: ## Run all pre-commit hooks against the whole tree
	pre-commit run --all-files

# --- Database migrations -----------------------------------------------------
migrate: db-up ## Apply all Alembic migrations (alembic upgrade head)
	cd $(BACKEND_DIR) && $(ALEMBIC) upgrade head

migrate-rev: db-up ## Autogenerate a new revision: make migrate-rev m="message"
	cd $(BACKEND_DIR) && $(ALEMBIC) revision --autogenerate -m "$(m)"

migrate-check: migrate ## Drift gate: fail if models changed without a migration (CI parity)
	cd $(BACKEND_DIR) && $(ALEMBIC) check

seed: db-up ## Load demo data via backend/seed.py
	cd $(BACKEND_DIR) && $(PY) seed.py

# --- OpenAPI -> TypeScript types --------------------------------------------
gen-types: ## Boot FastAPI, dump OpenAPI, regenerate frontend api-types.ts
	@echo ">> Booting backend to dump OpenAPI -> $(API_TYPES_OUT)"
	cd $(BACKEND_DIR) && $(UVICORN) $(APP_MODULE) --port $(API_PORT) & \
	SERVER_PID=$$!; \
	trap 'kill $$SERVER_PID 2>/dev/null' EXIT; \
	for i in $$(seq 1 30); do \
		curl -sf $(OPENAPI_URL) >/dev/null 2>&1 && break; \
		sleep 1; \
	done; \
	npx --yes openapi-typescript $(OPENAPI_URL) -o $(API_TYPES_OUT); \
	echo ">> Wrote $(API_TYPES_OUT)"

# --- Deploy ------------------------------------------------------------------
deploy: ## Local trigger of the prod deploy script (CI normally does this on merge)
	bash deploy/deploy.sh

# --- Housekeeping ------------------------------------------------------------
clean: ## Remove the dev DB container + volume (DESTRUCTIVE: drops dev data)
	$(COMPOSE) down -v
