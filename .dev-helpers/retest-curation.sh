#!/usr/bin/env bash
set +e
sleep 3
BASKET_ID="34804656-f329-48a9-9a82-b194b95e2af8"

echo "=== curl /curadoria-atual ==="
curl -s -w "\n[status=%{http_code}]\n" "http://localhost:8000/api/cestas/${BASKET_ID}/curadoria-atual" | head -c 800
echo
echo
echo "=== Next page /cestas/{id} ==="
code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/cestas/${BASKET_ID}")
echo "code=$code"
