#!/usr/bin/env bash
# ============================================================================
# AAPel — daily Postgres backup → Magalu Object Storage
# ============================================================================
# Invoked by systemd timer (ops/aapel-backup.timer) at 03:00 UTC.
#
# Strategy:
#   - pg_dump (plain SQL) | gzip → /var/lib/aapel/backups/aapel-<ts>.sql.gz
#   - s3cmd put → s3://$BACKUP_S3_BUCKET/aapel-<ts>.sql.gz
#   - Local retention: 7 days; remote: 30 days (configurable)
# ============================================================================

set -euo pipefail

SECRETS_DIR=/etc/aapel/secrets
BACKUP_DIR=/var/lib/aapel/backups
COMPOSE_PROJECT_NAME=aapel
DB_CONTAINER="${COMPOSE_PROJECT_NAME}-db-1"

# shellcheck disable=SC1091
source "$SECRETS_DIR/db.env"
# shellcheck disable=SC1091
source "$SECRETS_DIR/backup.env"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/aapel-${TIMESTAMP}.sql.gz"

log() { echo "[$(date -Iseconds)] $*"; }

log "==> Dumping → $BACKUP_FILE"
docker exec -i "$DB_CONTAINER" pg_dump \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --format=plain \
    --no-owner \
    --no-acl \
    --quote-all-identifiers \
    | gzip -9 > "$BACKUP_FILE"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "    size: $SIZE"

# Upload (only if credentials present)
if [[ -n "${BACKUP_S3_ACCESS_KEY:-}" && -n "${BACKUP_S3_SECRET_KEY:-}" ]]; then
    log "==> Uploading to s3://$BACKUP_S3_BUCKET/"
    HOST_NO_SCHEME="${BACKUP_S3_ENDPOINT#https://}"
    HOST_NO_SCHEME="${HOST_NO_SCHEME#http://}"
    s3cmd \
        --access_key="$BACKUP_S3_ACCESS_KEY" \
        --secret_key="$BACKUP_S3_SECRET_KEY" \
        --host="$HOST_NO_SCHEME" \
        --host-bucket="%(bucket)s.${HOST_NO_SCHEME}" \
        --no-progress \
        put "$BACKUP_FILE" "s3://${BACKUP_S3_BUCKET}/$(basename "$BACKUP_FILE")"
    log "==> Uploaded"
else
    log "==> Skipping upload (no S3 credentials in backup.env)"
fi

# Local retention
log "==> Pruning local backups older than ${BACKUP_RETENTION_DAYS_LOCAL:-7}d"
find "$BACKUP_DIR" -name "aapel-*.sql.gz" \
    -mtime +"${BACKUP_RETENTION_DAYS_LOCAL:-7}" -delete

log "==> Backup complete"
