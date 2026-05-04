#!/usr/bin/env bash
echo "=== full ls /app/.venv/bin in image ==="
docker run --rm --entrypoint /bin/sh aapel-api -c "ls /app/.venv/bin"
echo
echo "=== look for uvicorn anywhere ==="
docker run --rm --entrypoint /bin/sh aapel-api -c "find /app -name 'uvicorn*' 2>/dev/null"
