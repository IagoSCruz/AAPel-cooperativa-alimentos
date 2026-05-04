#!/usr/bin/env bash
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos
COMPOSE="docker compose -f compose.yaml -f compose.dev.yaml"

echo "=== latest api logs ==="
$COMPOSE logs --tail=20 api
echo
echo "=== inspect: what's at /app/.venv/bin in the image? ==="
docker run --rm --entrypoint /bin/sh aapel-api -c "ls /app/.venv/bin | head -20; echo '---'; file /app/.venv/bin/uvicorn 2>&1; echo '---'; head -1 /app/.venv/bin/uvicorn 2>&1; echo '---'; ls /app/app 2>&1 | head"
