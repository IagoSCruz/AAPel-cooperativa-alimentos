#!/usr/bin/env bash
# ============================================================================
# AAPel — deploy (run on VPS as `deploy` user from project root)
# ============================================================================
# Steps:
#   1. git pull (fast-forward only)
#   2. Source secrets from /etc/aapel/secrets
#   3. Build images
#   4. Pull external images
#   5. Run Drizzle migrations (one-off `migrate` profile)
#   6. Bring services up (-d)
#   7. Prune dangling images
# ============================================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_DIR=/etc/aapel/secrets

cd "$PROJECT_DIR"

log() { echo "[$(date -Iseconds)] $*"; }

# Verify secrets are set up
for f in db.env api.env web.env caddy.env; do
    if [[ ! -r "$SECRETS_DIR/$f" ]]; then
        log "ERROR: missing or unreadable $SECRETS_DIR/$f. Run setup-secrets.sh first."
        exit 1
    fi
done

# Source all secret files; export every var so docker compose interpolation works
log "==> Sourcing secrets"
set -a
# shellcheck disable=SC1091
source "$SECRETS_DIR/db.env"
# shellcheck disable=SC1091
source "$SECRETS_DIR/api.env"
# shellcheck disable=SC1091
source "$SECRETS_DIR/web.env"
# shellcheck disable=SC1091
source "$SECRETS_DIR/caddy.env"
set +a

COMPOSE=(docker compose -f compose.yaml -f compose.prod.yaml)

log "==> git pull"
git pull --ff-only

log "==> Building images"
"${COMPOSE[@]}" build

log "==> Pulling external images (postgres, caddy)"
"${COMPOSE[@]}" pull --ignore-pull-failures || true

log "==> Running migrations"
"${COMPOSE[@]}" --profile migrate run --rm migrate

log "==> Bringing services up"
"${COMPOSE[@]}" up -d --remove-orphans

log "==> Pruning dangling images"
docker image prune -f

log "==> Status"
"${COMPOSE[@]}" ps

log "==> Deployment complete"
