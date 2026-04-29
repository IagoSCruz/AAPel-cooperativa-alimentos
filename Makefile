# ============================================================================
# AAPel — Makefile
# ============================================================================
# Shortcuts for the most common dev/ops tasks. Avoid memorizing compose flags.
# ============================================================================

COMPOSE_DEV  := docker compose -f compose.yaml -f compose.dev.yaml
COMPOSE_PROD := docker compose -f compose.yaml -f compose.prod.yaml

.DEFAULT_GOAL := help

# ----- meta ----------------------------------------------------------------

.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[1;36m%-18s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ----- dev -----------------------------------------------------------------

.PHONY: dev
dev: ## Start db + api in dev mode (frontend runs separately with pnpm dev)
	$(COMPOSE_DEV) up -d db api
	@echo
	@echo "  API:    http://localhost:8000/api/docs"
	@echo "  DB:     localhost:5432 (user: aapel)"
	@echo "  Frontend: run 'pnpm dev' in another terminal"
	@echo

.PHONY: dev-stop
dev-stop: ## Stop dev stack
	$(COMPOSE_DEV) down

.PHONY: dev-clean
dev-clean: ## Stop dev stack AND remove the postgres volume (DESTRUCTIVE)
	$(COMPOSE_DEV) down -v

# ----- prod ----------------------------------------------------------------

.PHONY: prod-up
prod-up: ## Start production stack (db + api + web + caddy)
	$(COMPOSE_PROD) up -d

.PHONY: prod-down
prod-down: ## Stop production stack
	$(COMPOSE_PROD) down

.PHONY: prod-build
prod-build: ## Rebuild production images
	$(COMPOSE_PROD) build

.PHONY: prod-pull
prod-pull: ## Pull external images (postgres, caddy)
	$(COMPOSE_PROD) pull --ignore-pull-failures

# ----- logs ----------------------------------------------------------------

.PHONY: logs
logs: ## Tail logs of dev stack (use SVC=db|api to filter)
	$(COMPOSE_DEV) logs -f $(SVC)

.PHONY: prod-logs
prod-logs: ## Tail logs of prod stack (use SVC=db|api|web|caddy)
	$(COMPOSE_PROD) logs -f $(SVC)

# ----- db ------------------------------------------------------------------

.PHONY: db-shell
db-shell: ## psql into the db container (dev)
	$(COMPOSE_DEV) exec db psql -U $${POSTGRES_USER:-aapel} -d $${POSTGRES_DB:-aapel}

.PHONY: migrate
migrate: ## Apply Drizzle migrations (dev)
	$(COMPOSE_DEV) --profile migrate run --rm migrate pnpm db:migrate

.PHONY: migrate-generate
migrate-generate: ## Generate a new migration from schema changes (host-side)
	pnpm db:generate

.PHONY: seed
seed: ## Run database seed (dev)
	$(COMPOSE_DEV) --profile migrate run --rm migrate pnpm db:seed

.PHONY: db-reset
db-reset: dev-clean dev migrate seed ## Wipe + recreate + seed (DESTRUCTIVE, dev only)

# ----- ops -----------------------------------------------------------------

.PHONY: backup
backup: ## Run a one-off backup now (uses /etc/aapel/secrets)
	bash scripts/backup.sh

.PHONY: restore
restore: ## Restore from backup file (usage: make restore F=path/to/backup.sql.gz)
	@test -n "$(F)" || (echo "Usage: make restore F=path/to/backup.sql.gz"; exit 1)
	bash scripts/restore.sh $(F)

.PHONY: deploy
deploy: ## Deploy to VPS (run on VPS as deploy user)
	bash scripts/deploy.sh

# ----- frontend (host) -----------------------------------------------------

.PHONY: install
install: ## Install pnpm + Python deps
	pnpm install
	cd backend && uv sync

.PHONY: web
web: ## Run Next.js dev server natively (host)
	pnpm dev
