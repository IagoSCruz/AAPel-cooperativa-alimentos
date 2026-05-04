#!/usr/bin/env bash
set -e
export PATH="$HOME/.local/bin:$HOME/.local/share/pnpm:$PATH"
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos
echo "=== pnpm install ==="
pnpm install
echo
echo "=== DONE ==="
