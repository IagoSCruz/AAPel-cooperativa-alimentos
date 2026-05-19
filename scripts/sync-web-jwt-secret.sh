#!/usr/bin/env bash
# ============================================================================
# Copy JWT_SECRET from api.env into web.env (idempotent patch for existing VPS).
# Run on the VPS as root after pulling this script:
#   sudo bash scripts/sync-web-jwt-secret.sh
# Then redeploy: bash scripts/deploy.sh
# ============================================================================

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
    echo "ERROR: run as root (or with sudo)." >&2
    exit 1
fi

SECRETS_DIR=/etc/aapel/secrets
API_ENV="$SECRETS_DIR/api.env"
WEB_ENV="$SECRETS_DIR/web.env"

if [[ ! -r "$API_ENV" ]]; then
    echo "ERROR: missing $API_ENV" >&2
    exit 1
fi

# shellcheck disable=SC1090
source "$API_ENV"

if [[ -z "${JWT_SECRET:-}" ]]; then
    echo "ERROR: JWT_SECRET not set in $API_ENV" >&2
    exit 1
fi

if [[ ! -f "$WEB_ENV" ]]; then
    echo "ERROR: missing $WEB_ENV — run setup-secrets.sh first." >&2
    exit 1
fi

if grep -q '^JWT_SECRET=' "$WEB_ENV"; then
    # Update in place if value differs
    if grep -q "^JWT_SECRET=${JWT_SECRET}$" "$WEB_ENV"; then
        echo "OK: JWT_SECRET already present in web.env"
        exit 0
    fi
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$WEB_ENV"
    echo "UPDATED: JWT_SECRET in web.env"
else
    echo "JWT_SECRET=${JWT_SECRET}" >> "$WEB_ENV"
    echo "APPENDED: JWT_SECRET to web.env"
fi

chmod 0640 "$WEB_ENV"
chown root:docker "$WEB_ENV"
echo "Done. Run deploy to restart the web container."
