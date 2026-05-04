#!/usr/bin/env bash
# Probe the failing endpoint and capture the API error log.
set +e

BASKET_ID="34804656-f329-48a9-9a82-b194b95e2af8"

echo "=== API response (with verbose body) ==="
curl -s -w "\n[status=%{http_code}]\n" "http://localhost:8000/api/cestas/${BASKET_ID}/curadoria-atual"
echo
echo "=== API container logs (last 60 lines) ==="
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos
docker compose -f compose.yaml -f compose.dev.yaml logs --tail=60 api
