#!/usr/bin/env bash
set +e
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
  echo "[$i] code=$code"
  if [ "$code" = "200" ] || [ "$code" = "307" ] || [ "$code" = "302" ]; then
    echo "OK — frontend up"
    exit 0
  fi
  sleep 2
done
exit 1
