#!/usr/bin/env bash
# Run pnpm dev with explicit output, blocking up to 25s, then kill it.
set +e
export PATH="$HOME/.local/bin:$HOME/.local/share/pnpm:$PATH"
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos

echo "=== launching pnpm dev for 25s ==="
timeout --preserve-status 25 pnpm dev 2>&1 | head -60
echo
echo "=== exit ==="
