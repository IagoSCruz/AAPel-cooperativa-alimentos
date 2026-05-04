#!/usr/bin/env bash
set -e
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos

echo "=== stop stack ==="
docker compose -f compose.yaml -f compose.dev.yaml down

echo
echo "=== rebuild api image (no cache) ==="
docker compose -f compose.yaml -f compose.dev.yaml build --no-cache api

echo
echo "=== bring stack back up ==="
docker compose -f compose.yaml -f compose.dev.yaml up -d db api

echo
echo "=== status ==="
sleep 5
docker compose -f compose.yaml -f compose.dev.yaml ps
