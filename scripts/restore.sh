#!/usr/bin/env bash
# ============================================================================
# AAPel — restore from a backup archive
# ============================================================================
# WARNING: this DESTROYS the current database content.
#
# Usage:
#   bash scripts/restore.sh /var/lib/aapel/backups/aapel-20260428_030000.sql.gz
#
# Or fetch from object storage first:
#   s3cmd get s3://aapel-backups/aapel-20260428_030000.sql.gz /tmp/restore.sql.gz
#   bash scripts/restore.sh /tmp/restore.sql.gz
# ============================================================================

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <backup-file.sql.gz>" >&2
    exit 1
fi

BACKUP_FILE="$1"
SECRETS_DIR=/etc/aapel/secrets
COMPOSE_PROJECT_NAME=aapel
DB_CONTAINER="${COMPOSE_PROJECT_NAME}-db-1"

if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "ERROR: backup file not found: $BACKUP_FILE" >&2
    exit 1
fi

# shellcheck disable=SC1091
source "$SECRETS_DIR/db.env"

echo "================================================================"
echo "  WARNING: this will OVERWRITE the current database '$POSTGRES_DB'"
echo "  Source: $BACKUP_FILE"
echo "================================================================"
read -rp "Type 'restore' to continue: " confirm
[[ "$confirm" == "restore" ]] || { echo "Aborted."; exit 1; }

echo "==> Stopping api/web (db stays up)"
docker compose -f compose.yaml -f compose.prod.yaml stop api web caddy 2>/dev/null || true

echo "==> Dropping + recreating database"
docker exec -i "$DB_CONTAINER" psql -U "$POSTGRES_USER" -d postgres <<EOF
DROP DATABASE IF EXISTS $POSTGRES_DB;
CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;
EOF

echo "==> Restoring from $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

echo "==> Restarting services"
docker compose -f compose.yaml -f compose.prod.yaml up -d

echo "==> Restore complete"
