#!/usr/bin/env bash
# End-to-end backend flow: register → /me → list products → create order → list orders.
# Uses jq if available, otherwise grep+cut.
set -e

API="http://localhost:8000"
EMAIL="e2e-test-$(date +%s)@example.com"
NAME="E2E Test User"
PASSWORD="senha-segura-12345"

j() {
  if command -v jq >/dev/null; then jq "$@"; else cat; fi
}

heading() { echo; echo "============================================================"; echo "  $1"; echo "============================================================"; }

heading "1. REGISTER → expect TokenPair"
REGISTER_RESPONSE=$(curl -sf -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"$NAME\",
    \"password\": \"$PASSWORD\",
    \"phone\": \"(53) 99999-0000\",
    \"consent_terms\": true,
    \"consent_privacy\": true,
    \"consent_marketing\": true,
    \"consent_analytics\": false
  }")
echo "$REGISTER_RESPONSE" | j '.'
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -oE '"access_token":"[^"]+' | cut -d'"' -f4)
if [ -z "$ACCESS_TOKEN" ]; then echo "FAIL: no access_token"; exit 1; fi
echo "  email used: $EMAIL"
echo "  token len: ${#ACCESS_TOKEN}"

heading "2. GET /api/auth/me — confirm authenticated user"
ME=$(curl -sf "$API/api/auth/me" -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$ME" | j '.'

heading "3. LOGIN with same creds → confirm a second TokenPair issued"
LOGIN=$(curl -sf -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
echo "$LOGIN" | j '.'

heading "4. LIST products — pick one with stock"
PRODUCT=$(curl -sf "$API/api/produtos?limit=1&disponiveis=true" | grep -oE '"id":"[^"]+","name":"[^"]+"' | head -1)
PID=$(echo "$PRODUCT" | grep -oE '"id":"[^"]+' | head -1 | cut -d'"' -f4)
PNAME=$(echo "$PRODUCT" | grep -oE '"name":"[^"]+' | head -1 | cut -d'"' -f4)
echo "  picked: $PNAME ($PID)"

heading "5. LIST delivery zones — pick one"
ZONE=$(curl -sf "$API/api/zonas-entrega" | grep -oE '"id":"[^"]+","name":"[^"]+"' | head -1)
ZID=$(echo "$ZONE" | grep -oE '"id":"[^"]+' | head -1 | cut -d'"' -f4)
ZNAME=$(echo "$ZONE" | grep -oE '"name":"[^"]+' | head -1 | cut -d'"' -f4)
echo "  picked: $ZNAME ($ZID)"

heading "6. POST /api/pedidos — create order"
ORDER_BODY="{
  \"items\": [{\"product_id\":\"$PID\",\"quantity\":2}],
  \"delivery_method\": \"HOME_DELIVERY\",
  \"delivery_zone_id\": \"$ZID\",
  \"delivery_address\": \"Rua Teste, 123\",
  \"delivery_neighborhood\": \"Centro\",
  \"payment_method\": \"PIX\",
  \"notes\": \"E2E smoke test\"
}"
ORDER=$(curl -sf -X POST "$API/api/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$ORDER_BODY")
echo "$ORDER" | j '.'
PUBLIC_ID=$(echo "$ORDER" | grep -oE '"public_id":"[^"]+' | cut -d'"' -f4)
echo "  public_id: $PUBLIC_ID"

heading "7. GET /api/pedidos/meus — should contain the new order"
MY_ORDERS=$(curl -sf "$API/api/pedidos/meus" -H "Authorization: Bearer $ACCESS_TOKEN")
echo "$MY_ORDERS" | j '.'

heading "8. ASSERTIONS"
if echo "$MY_ORDERS" | grep -q "$PUBLIC_ID"; then
  echo "  ✓ new order $PUBLIC_ID found in /pedidos/meus"
else
  echo "  ✗ new order NOT in /pedidos/meus"
  exit 1
fi

heading "9. NEGATIVE: POST /api/pedidos without auth → expect 401"
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/pedidos" \
  -H "Content-Type: application/json" \
  -d "$ORDER_BODY")
echo "  status=$status (expected 401)"
if [ "$status" != "401" ]; then echo "  ✗ FAIL"; exit 1; fi
echo "  ✓ unauthenticated create rejected"

heading "10. NEGATIVE: stock < requested → expect 400"
HUGE_BODY="{
  \"items\": [{\"product_id\":\"$PID\",\"quantity\":99}],
  \"delivery_method\": \"PICKUP\",
  \"collection_point_id\": null,
  \"payment_method\": \"PIX\"
}"
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/pedidos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$HUGE_BODY")
echo "  status=$status (expected 400)"
echo "  (response body): $(curl -s -X POST $API/api/pedidos -H 'Content-Type: application/json' -H \"Authorization: Bearer $ACCESS_TOKEN\" -d \"$HUGE_BODY\" | head -c 300)"

echo
echo "============================================================"
echo "  BACKEND E2E COMPLETE"
echo "============================================================"
