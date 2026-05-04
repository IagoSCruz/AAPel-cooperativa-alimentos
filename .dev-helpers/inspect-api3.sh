#!/usr/bin/env bash
echo "=== shebang of uvicorn ==="
docker run --rm --entrypoint /bin/sh aapel-api -c "head -1 /app/.venv/bin/uvicorn"
echo
echo "=== running directly ==="
docker run --rm --entrypoint /bin/sh aapel-api -c "ls -l /app/.venv/bin/python /app/.venv/bin/python3 /app/.venv/bin/python3.11 2>&1"
echo
echo "=== try python interpreter ==="
docker run --rm --entrypoint /bin/sh aapel-api -c "/app/.venv/bin/python --version 2>&1"
echo
echo "=== try uvicorn through python -m ==="
docker run --rm --entrypoint /bin/sh aapel-api -c "/app/.venv/bin/python -m uvicorn --version 2>&1"
