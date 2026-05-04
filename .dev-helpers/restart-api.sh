#!/usr/bin/env bash
set -e
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos
COMPOSE="docker compose -f compose.yaml -f compose.dev.yaml"

echo "=== recreate api container with new command ==="
$COMPOSE up -d --force-recreate api

echo
echo "=== wait for healthcheck ==="
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  status=$($COMPOSE ps --format '{{.Status}}' api | head -1)
  echo "[$i] $status"
  if echo "$status" | grep -q 'healthy'; then
    echo "OK — api healthy"
    break
  fi
  if echo "$status" | grep -qE 'Exit|Restarting'; then
    echo "FAIL — api crashed"
    $COMPOSE logs --tail=30 api
    exit 1
  fi
  sleep 3
done

echo
echo "=== curl health ==="
curl -sf http://localhost:8000/health
echo
