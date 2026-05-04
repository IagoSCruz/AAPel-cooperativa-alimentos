#!/usr/bin/env bash
# Start `pnpm dev` detached, write logs to a file, return PID.
set -e
export PATH="$HOME/.local/bin:$HOME/.local/share/pnpm:$PATH"
cd /home/iago_cruz/Dev/AAPel-cooperativa-alimentos

LOG="/tmp/aapel-frontend.log"
PIDFILE="/tmp/aapel-frontend.pid"

# Kill any previous instance
if [ -f "$PIDFILE" ]; then
  oldpid=$(cat "$PIDFILE")
  if kill -0 "$oldpid" 2>/dev/null; then
    echo "killing old frontend pid $oldpid"
    kill "$oldpid" 2>/dev/null || true
    sleep 1
  fi
fi

# Start
nohup pnpm dev > "$LOG" 2>&1 &
echo $! > "$PIDFILE"
echo "started pnpm dev with pid $(cat $PIDFILE)"
echo "logs: $LOG"
