#!/usr/bin/env bash
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos
docker compose -f compose.yaml -f compose.dev.yaml logs --tail=80 api
