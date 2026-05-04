#!/usr/bin/env bash
# Kill any running next dev and restart fresh.
set +e

echo "=== killing existing next dev / pnpm dev ==="
pkill -f 'next dev' 2>/dev/null || true
pkill -f 'pnpm dev' 2>/dev/null || true
sleep 2

# Confirm port 3000 is free
if ss -ltnp 2>/dev/null | grep -q ':3000 '; then
  echo "port 3000 still busy — force kill"
  fuser -k 3000/tcp 2>/dev/null || true
  sleep 1
fi

echo "=== starting fresh ==="
export PATH="$HOME/.local/bin:$HOME/.local/share/pnpm:$PATH"
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos
exec pnpm dev > /tmp/aapel-frontend.log 2>&1
