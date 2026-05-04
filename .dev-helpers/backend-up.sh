#!/usr/bin/env bash
set -e
export PATH="$HOME/.local/bin:$HOME/.local/share/pnpm:$PATH"
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos
echo "=== make dev ==="
make dev
echo
echo "=== container status ==="
docker compose -f compose.yaml -f compose.dev.yaml ps
