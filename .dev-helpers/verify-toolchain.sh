#!/usr/bin/env bash
# Verify Node + pnpm are reachable with proper PATH set.
set -e
export PATH="$HOME/.local/bin:$HOME/.local/share/pnpm:$PATH"

echo "=== which ==="
which node
which npm
which pnpm

echo
echo "=== versions ==="
node --version
npm --version
pnpm --version

echo
echo "=== DONE ==="
