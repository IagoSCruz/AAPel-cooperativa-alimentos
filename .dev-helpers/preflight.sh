#!/usr/bin/env bash
# Confirm the deps required to run `make dev` are present.
set +e
export PATH="$HOME/.local/bin:$HOME/.local/share/pnpm:$PATH"
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos

echo "=== docker ==="
docker --version 2>&1 || echo "docker missing"
echo
echo "=== docker compose ==="
docker compose version 2>&1 || echo "compose missing"
echo
echo "=== make ==="
make --version | head -1 2>&1 || echo "make missing"
echo
echo "=== .env present? ==="
if [ -f .env ]; then
  echo ".env exists ($(wc -l < .env) lines)"
  grep -E '^(POSTGRES_|JWT_|ANALYTICS_|ALLOWED_)' .env | sed 's/=.*/=<set>/'
else
  echo "MISSING .env"
fi
echo
echo "=== docker daemon reachable? ==="
docker info 2>&1 | head -3
