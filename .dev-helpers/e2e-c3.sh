#!/usr/bin/env bash
set -e

API="http://localhost:8000"
EMAIL="c3test-$(date +%s)@example.com"

REGISTER=$(curl -sf -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"name\":\"C3 Test\",\"password\":\"senha123\",\"phone\":\"(53)90000-9999\",\"consent_terms\":true,\"consent_privacy\":true,\"consent_marketing\":false,\"consent_analytics\":true}")
TOKEN=$(echo "$REGISTER" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

TEMPLATE_ID="34804656-f329-48a9-9a82-b194b95e2af8"
SLOT_FRUTAS="137893a1-d4b6-49b5-bb51-4ef9c022215b"
SLOT_VERDURAS="4034cab6-d922-4142-b883-6f34ab240314"
SLOT_LEGUMES="6fb19699-e7d6-4e6d-acb7-d0b00e7d944a"
PROD_MORANGO="5d71d21a-31b6-4c22-a8ad-ef9d7d5c8268"
PROD_ALFACE="a0b8adcc-9160-441e-a5b0-e2df66d5acb8"
PROD_TOMATE="6c9e133b-334e-4f64-9938-6fdd274b7782"
ZID="40bd4f1b-67f1-4249-b595-2cbacd6d6544"

CHOICES="[{\"slot_id\":\"$SLOT_FRUTAS\",\"product_id\":\"$PROD_MORANGO\"},{\"slot_id\":\"$SLOT_VERDURAS\",\"product_id\":\"$PROD_ALFACE\"},{\"slot_id\":\"$SLOT_LEGUMES\",\"product_id\":\"$PROD_TOMATE\"}]"

# C3a: empty delivery_address
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/cestas/$TEMPLATE_ID/personalizar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"slot_choices\":$CHOICES,\"delivery_method\":\"HOME_DELIVERY\",\"delivery_zone_id\":\"$ZID\",\"delivery_address\":\"\",\"delivery_neighborhood\":\"Centro\",\"payment_method\":\"PIX\"}")
echo "C3a empty address → HTTP $STATUS"
[ "$STATUS" = "400" ] && echo "  ✓ PASS" || { echo "  ✗ FAIL"; exit 1; }

# C3b: whitespace-only neighborhood
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/cestas/$TEMPLATE_ID/personalizar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"slot_choices\":$CHOICES,\"delivery_method\":\"HOME_DELIVERY\",\"delivery_zone_id\":\"$ZID\",\"delivery_address\":\"Rua Teste 1\",\"delivery_neighborhood\":\"   \",\"payment_method\":\"PIX\"}")
echo "C3b whitespace-only neighborhood → HTTP $STATUS"
[ "$STATUS" = "400" ] && echo "  ✓ PASS" || { echo "  ✗ FAIL"; exit 1; }

# C3c: invalid delivery_method — Pydantic should reject with 422
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/cestas/$TEMPLATE_ID/personalizar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"slot_choices\":$CHOICES,\"delivery_method\":\"TELEPORT\",\"payment_method\":\"PIX\"}")
echo "C3c invalid delivery_method → HTTP $STATUS"
[ "$STATUS" = "422" ] && echo "  ✓ PASS" || { echo "  ✗ FAIL"; exit 1; }

echo
echo "All C3 checks PASSED"
