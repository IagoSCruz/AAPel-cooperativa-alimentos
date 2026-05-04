#!/usr/bin/env bash
# Probe whether pnpm + node are reachable.
set -e
export PATH="$HOME/.local/share/pnpm:$PATH"
echo "=== PATH ==="
echo "$PATH" | tr ':' '\n' | head -20
echo
echo "=== pnpm version ==="
pnpm --version
echo
echo "=== node version ==="
node --version
echo
echo "=== which ==="
which pnpm
which node
