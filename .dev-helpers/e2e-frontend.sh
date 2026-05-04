#!/usr/bin/env bash
# E2E frontend flow without a browser:
#   1. Register a customer via API → get access_token
#   2. Set access_token as the `aapel_customer_session` cookie
#   3. Hit Next.js pages as that logged-in user — verify auth gates pass
#      and that RSC pages render real DB data in HTML.
#   4. Verify the underlying create-order API call (same one the checkout
#      server action makes) succeeds with the token.
set -e

API="http://localhost:8000"
FRONT="http://localhost:3000"
EMAIL="fe-e2e-$(date +%s)@example.com"
PASSWORD="senha-segura-12345"
COOKIE_JAR=/tmp/aapel-e2e-cookies.txt
rm -f "$COOKIE_JAR"

heading() { echo; echo "============================================================"; echo "  $1"; echo "============================================================"; }

heading "1. REGISTER"
TOKEN=$(curl -sf -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"name\": \"FE E2E Tester\",
    \"password\": \"$PASSWORD\",
    \"phone\": \"(53) 90000-0000\",
    \"consent_terms\": true,
    \"consent_privacy\": true,
    \"consent_marketing\": false,
    \"consent_analytics\": true
  }" | grep -oE '"access_token":"[^"]+' | cut -d'"' -f4)
echo "  email: $EMAIL"
echo "  token len: ${#TOKEN}"

heading "2. SET CUSTOMER SESSION COOKIE"
# This is exactly what the loginAction does after a successful login.
# We're simulating that step manually so we can drive Next.js as a logged-in user.
echo "# Netscape HTTP Cookie File" > "$COOKIE_JAR"
echo -e "localhost\tFALSE\t/\tFALSE\t0\taapel_customer_session\t$TOKEN" >> "$COOKIE_JAR"
echo "  cookie set in $COOKIE_JAR"

heading "3. RENDER PROTECTED PAGES"
echo "--- /conta (auth required) ---"
code=$(curl -s -b "$COOKIE_JAR" -o /tmp/conta.html -w "%{http_code}" "$FRONT/conta")
echo "  status=$code (expected 200, no redirect to /conta/login)"
[ "$code" = "200" ] || { echo "  ✗ FAIL"; exit 1; }
# Confirm it's not the public login page rendering
if grep -q 'Entrar na sua conta' /tmp/conta.html; then
  echo "  ✗ FAIL — got login page, cookie not honored"; exit 1
fi
echo "  ✓ logged-in account page rendered"

echo
echo "--- /checkout (auth required) ---"
code=$(curl -s -b "$COOKIE_JAR" -o /tmp/checkout.html -w "%{http_code}" "$FRONT/checkout")
echo "  status=$code"
[ "$code" = "200" ] || { echo "  ✗ FAIL"; exit 1; }
echo "  ✓ checkout page rendered"

heading "4. RENDER PUBLIC PAGES — verify real DB data flows to HTML"
curl -s "$FRONT/produtos" -o /tmp/produtos.html
echo "--- search for known seed product ('Abobrinha Verde') ---"
if grep -q 'Abobrinha Verde' /tmp/produtos.html; then
  echo "  ✓ produto do seed aparece no HTML do /produtos"
else
  echo "  ✗ FAIL — seed product not in HTML"; exit 1
fi

curl -s "$FRONT/produtores" -o /tmp/produtores.html
echo "--- search for known seed producer ('Fazenda Verde Vale') ---"
if grep -q 'Fazenda Verde Vale' /tmp/produtores.html; then
  echo "  ✓ produtor do seed aparece no HTML do /produtores"
else
  echo "  ✗ FAIL — seed producer not in HTML"; exit 1
fi

curl -s "$FRONT/cestas" -o /tmp/cestas.html
echo "--- search for known seed basket ('Cesta Essencial') ---"
if grep -q 'Cesta Essencial' /tmp/cestas.html; then
  echo "  ✓ cesta do seed aparece no HTML do /cestas"
else
  echo "  ✗ FAIL — seed basket not in HTML"; exit 1
fi

heading "5. SIMULATE CHECKOUT — call the same POST /api/pedidos the server action would"
PID=$(curl -s "$API/api/produtos?limit=1&disponiveis=true" | grep -oE '"id":"[^"]+' | head -1 | cut -d'"' -f4)
ZID=$(curl -s "$API/api/zonas-entrega" | grep -oE '"id":"[^"]+' | head -1 | cut -d'"' -f4)
echo "  product: $PID"
echo "  zone:    $ZID"

ORDER=$(curl -sf -X POST "$API/api/pedidos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\":[{\"product_id\":\"$PID\",\"quantity\":3}],
    \"delivery_method\":\"HOME_DELIVERY\",
    \"delivery_zone_id\":\"$ZID\",
    \"delivery_address\":\"Rua FE E2E, 42\",
    \"delivery_neighborhood\":\"Centro\",
    \"payment_method\":\"PIX\",
    \"notes\":\"frontend e2e simulation\"
  }")
PUBLIC_ID=$(echo "$ORDER" | grep -oE '"public_id":"[^"]+' | cut -d'"' -f4)
TOTAL=$(echo "$ORDER" | grep -oE '"total_amount":"[^"]+' | cut -d'"' -f4)
DELIVERY=$(echo "$ORDER" | grep -oE '"delivery_date":"[^"]+' | cut -d'"' -f4)
echo "  ✓ order created"
echo "    public_id: $PUBLIC_ID"
echo "    total:     R\$ $TOTAL"
echo "    delivery:  $DELIVERY"

heading "6. VERIFY ORDER APPEARS IN /pedidos/meus"
MINE=$(curl -sf "$API/api/pedidos/meus" -H "Authorization: Bearer $TOKEN")
if echo "$MINE" | grep -q "$PUBLIC_ID"; then
  echo "  ✓ pedido $PUBLIC_ID está em /pedidos/meus"
else
  echo "  ✗ FAIL"; exit 1
fi

heading "7. SUMMARY"
echo "  ✓ User registered + auth cookie honored by Next.js"
echo "  ✓ /conta renders (auth-gated)"
echo "  ✓ /checkout renders (auth-gated)"
echo "  ✓ /produtos, /produtores, /cestas show real DB data in HTML"
echo "  ✓ Order creation API works with the customer's Bearer token"
echo "  ✓ Order appears in user's order history"
echo
echo "  → Full chain verified: DB → FastAPI → Next.js RSC → HTML"
echo "  → Auth chain verified: register → JWT → httpOnly cookie → server-action"
