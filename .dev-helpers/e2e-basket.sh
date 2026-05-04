#!/usr/bin/env bash
set -e

API="http://localhost:8000"
EMAIL="basket-e2e-$(date +%s)@example.com"

heading() { echo; echo "============================================================"; echo "  $1"; echo "============================================================"; }
jq_val() { echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['$2'])"; }

heading "1. REGISTER"
REGISTER=$(curl -sf -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"name\":\"Basket E2E\",\"password\":\"senha123\",\"phone\":\"(53)90000-1111\",\"consent_terms\":true,\"consent_privacy\":true,\"consent_marketing\":false,\"consent_analytics\":true}")
TOKEN=$(jq_val "$REGISTER" access_token)
echo "  token len: ${#TOKEN}"
[ -n "$TOKEN" ] || { echo "  ✗ FAIL — no token"; exit 1; }

heading "2. GET DELIVERY ZONE"
ZONES=$(curl -sf "$API/api/zonas-entrega")
ZID=$(echo "$ZONES" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
echo "  zone: $ZID"
[ -n "$ZID" ] || { echo "  ✗ FAIL — no zone"; exit 1; }

heading "3. PERSONALIZAR CESTA ESSENCIAL"
TEMPLATE_ID="34804656-f329-48a9-9a82-b194b95e2af8"
SLOT_FRUTAS="137893a1-d4b6-49b5-bb51-4ef9c022215b"
SLOT_VERDURAS="4034cab6-d922-4142-b883-6f34ab240314"
SLOT_LEGUMES="6fb19699-e7d6-4e6d-acb7-d0b00e7d944a"
PROD_MORANGO="5d71d21a-31b6-4c22-a8ad-ef9d7d5c8268"
PROD_ALFACE="a0b8adcc-9160-441e-a5b0-e2df66d5acb8"
PROD_TOMATE="6c9e133b-334e-4f64-9938-6fdd274b7782"

RESPONSE=$(curl -sf -X POST "$API/api/cestas/$TEMPLATE_ID/personalizar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"slot_choices\": [
      {\"slot_id\":\"$SLOT_FRUTAS\",\"product_id\":\"$PROD_MORANGO\"},
      {\"slot_id\":\"$SLOT_VERDURAS\",\"product_id\":\"$PROD_ALFACE\"},
      {\"slot_id\":\"$SLOT_LEGUMES\",\"product_id\":\"$PROD_TOMATE\"}
    ],
    \"delivery_method\":\"HOME_DELIVERY\",
    \"delivery_zone_id\":\"$ZID\",
    \"delivery_address\":\"Rua Basket E2E, 42\",
    \"delivery_neighborhood\":\"Centro\",
    \"payment_method\":\"PIX\",
    \"notes\":\"basket e2e test\"
  }")

PUBLIC_ID=$(jq_val "$RESPONSE" public_id)
TOTAL=$(jq_val "$RESPONSE" total_amount)
WEEK=$(jq_val "$RESPONSE" delivery_week)
echo "  public_id:     $PUBLIC_ID"
echo "  delivery_week: $WEEK"
echo "  total_amount:  R$ $TOTAL"
echo "$RESPONSE" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for f in d['fulfillments']:
    print(f\"    {f['slot_label']} -> {f['product_name']} (fee R\$ {f['upgrade_fee_paid']})\")
"
[ -n "$PUBLIC_ID" ] || { echo "  ✗ FAIL — no public_id"; exit 1; }
echo "  ✓ pedido criado"

heading "4. VERIFY IN /pedidos/meus"
MINE=$(curl -sf "$API/api/pedidos/meus" -H "Authorization: Bearer $TOKEN")
if echo "$MINE" | grep -q "$PUBLIC_ID"; then
  echo "  ✓ pedido $PUBLIC_ID em /pedidos/meus"
else
  echo "  ✗ FAIL"; exit 1
fi

heading "5. VALIDATION — duplicate slot (expect 400)"
DUP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$API/api/cestas/$TEMPLATE_ID/personalizar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"slot_choices\":[
      {\"slot_id\":\"$SLOT_FRUTAS\",\"product_id\":\"$PROD_MORANGO\"},
      {\"slot_id\":\"$SLOT_FRUTAS\",\"product_id\":\"$PROD_MORANGO\"},
      {\"slot_id\":\"$SLOT_VERDURAS\",\"product_id\":\"$PROD_ALFACE\"},
      {\"slot_id\":\"$SLOT_LEGUMES\",\"product_id\":\"$PROD_TOMATE\"}
    ],
    \"delivery_method\":\"HOME_DELIVERY\",
    \"delivery_zone_id\":\"$ZID\",
    \"delivery_address\":\"R Test, 1\",
    \"delivery_neighborhood\":\"Centro\",
    \"payment_method\":\"PIX\"
  }")
echo "  duplicate slot -> HTTP $DUP_STATUS"
[ "$DUP_STATUS" = "400" ] || { echo "  ✗ FAIL — expected 400, got $DUP_STATUS"; exit 1; }
echo "  ✓ duplicate slot rejected"

heading "6. VALIDATION — no auth (expect 401)"
NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$API/api/cestas/$TEMPLATE_ID/personalizar" \
  -H "Content-Type: application/json" \
  -d "{\"slot_choices\":[],\"delivery_method\":\"HOME_DELIVERY\",\"payment_method\":\"PIX\"}")
echo "  no auth -> HTTP $NOAUTH"
[ "$NOAUTH" = "401" ] || { echo "  ✗ FAIL — expected 401, got $NOAUTH"; exit 1; }
echo "  ✓ no auth rejected"

heading "7. VALIDATION — wrong product for slot (expect 400)"
BADPROD=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "$API/api/cestas/$TEMPLATE_ID/personalizar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"slot_choices\":[
      {\"slot_id\":\"$SLOT_FRUTAS\",\"product_id\":\"$PROD_TOMATE\"},
      {\"slot_id\":\"$SLOT_VERDURAS\",\"product_id\":\"$PROD_ALFACE\"},
      {\"slot_id\":\"$SLOT_LEGUMES\",\"product_id\":\"$PROD_TOMATE\"}
    ],
    \"delivery_method\":\"HOME_DELIVERY\",
    \"delivery_zone_id\":\"$ZID\",
    \"delivery_address\":\"R Test, 1\",
    \"delivery_neighborhood\":\"Centro\",
    \"payment_method\":\"PIX\"
  }")
echo "  wrong product for slot -> HTTP $BADPROD"
[ "$BADPROD" = "400" ] || { echo "  ✗ FAIL — expected 400, got $BADPROD"; exit 1; }
echo "  ✓ invalid slot option rejected"

heading "SUMMARY"
echo "  ✓ Register → JWT"
echo "  ✓ POST /cestas/{id}/personalizar → order + fulfillments created"
echo "  ✓ Pedido aparece em /pedidos/meus"
echo "  ✓ Duplicate slot → 400"
echo "  ✓ No auth → 401"
echo "  ✓ Wrong product for slot → 400"
echo
echo "  → Phase 4 basket customization fully verified (7/7)"
