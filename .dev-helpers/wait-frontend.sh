#!/usr/bin/env bash
# Poll until the Next.js dev server responds at /, or print logs and fail.
set +e
LOG="/tmp/aapel-frontend.log"
PIDFILE="/tmp/aapel-frontend.pid"

for i in $(seq 1 60); do
  if [ -f "$PIDFILE" ] && ! kill -0 "$(cat $PIDFILE)" 2>/dev/null; then
    echo "[$i] frontend pid not alive — crashed?"
    tail -40 "$LOG"
    exit 1
  fi
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "ERR")
  echo "[$i] status=$status"
  if [ "$status" = "200" ] || [ "$status" = "307" ] || [ "$status" = "302" ]; then
    echo "OK — frontend up"
    exit 0
  fi
  sleep 2
done
echo "TIMEOUT — last 40 lines of log:"
tail -40 "$LOG"
exit 1
