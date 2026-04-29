#!/usr/bin/env bash
# ============================================================================
# AAPel — initialize /etc/aapel/secrets/*.env on the VPS
# ============================================================================
# Idempotent: existing files are preserved (script never overwrites).
# Generates strong random JWT_SECRET, ANALYTICS_PEPPER, and POSTGRES_PASSWORD
# on first run.
#
# Run as root (or sudo) on the VPS.
#
# Usage:
#   sudo AAPEL_DOMAIN=191-235-100-50.nip.io ACME_EMAIL=you@email.com \
#       bash scripts/setup-secrets.sh
# ============================================================================

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: run as root (or with sudo)." >&2
    exit 1
fi

SECRETS_DIR=/etc/aapel/secrets
install -d -m 0750 -o root -g docker "$SECRETS_DIR"

AAPEL_DOMAIN="${AAPEL_DOMAIN:-changeme.nip.io}"
ACME_EMAIL="${ACME_EMAIL:-admin@aapel.local}"

gen_secret() { openssl rand -base64 48 | tr -d '\n'; }
gen_password() { openssl rand -base64 24 | tr -d '/+=\n' | head -c 32; }

write_secret() {
    local file="$1"
    local body="$2"
    if [[ -f "$file" ]]; then
        echo "    SKIP    $file (already exists)"
        return 0
    fi
    echo "$body" > "$file"
    chmod 0640 "$file"
    chown root:docker "$file"
    echo "    CREATE  $file"
}

# -- db.env -----------------------------------------------------------------
DB_PASSWORD=$(gen_password)
write_secret "$SECRETS_DIR/db.env" "POSTGRES_USER=aapel
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=aapel"

# Reload (in case it was already there) so api.env can build DATABASE_URL
# shellcheck disable=SC1090
source "$SECRETS_DIR/db.env"

# -- api.env ----------------------------------------------------------------
JWT_SECRET=$(gen_secret)
PEPPER=$(gen_secret)
write_secret "$SECRETS_DIR/api.env" "DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
JWT_SECRET=$JWT_SECRET
JWT_ALGORITHM=HS256
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=7
ANALYTICS_PEPPER=$PEPPER
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=https://${AAPEL_DOMAIN}
DEBUG=false"

# -- web.env ----------------------------------------------------------------
NEXTAUTH_SECRET=$(gen_secret)
write_secret "$SECRETS_DIR/web.env" "NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://${AAPEL_DOMAIN}
NEXT_PUBLIC_API_URL=https://${AAPEL_DOMAIN}/api
INTERNAL_API_URL=http://api:8000
NEXTAUTH_URL=https://${AAPEL_DOMAIN}
NEXTAUTH_SECRET=$NEXTAUTH_SECRET"

# -- caddy.env --------------------------------------------------------------
write_secret "$SECRETS_DIR/caddy.env" "AAPEL_DOMAIN=${AAPEL_DOMAIN}
ACME_EMAIL=${ACME_EMAIL}"

# -- backup.env (operator must fill in) -------------------------------------
write_secret "$SECRETS_DIR/backup.env" "# Magalu Cloud Object Storage credentials — fill in manually
BACKUP_S3_ENDPOINT=https://br-se1.magaluobjects.com
BACKUP_S3_BUCKET=aapel-backups
BACKUP_S3_ACCESS_KEY=
BACKUP_S3_SECRET_KEY=
BACKUP_RETENTION_DAYS_LOCAL=7
BACKUP_RETENTION_DAYS_REMOTE=30"

echo
echo "==> Secrets prepared in $SECRETS_DIR"
echo "==> Domain: $AAPEL_DOMAIN"
echo
echo "Now: edit $SECRETS_DIR/backup.env and add your Magalu Object Storage keys"
echo "     before enabling the backup timer."
