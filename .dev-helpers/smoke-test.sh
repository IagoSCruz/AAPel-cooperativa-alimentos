#!/usr/bin/env bash
# Smoke-test all customer-facing pages.
# Acceptable codes: 200 OK, 307 Temporary Redirect (auth-required pages).
set +e

FRONT="http://localhost:3000"
API="http://localhost:8000"

echo "============================================================"
echo "  API DATA PRESENCE CHECK"
echo "============================================================"
echo
echo "--- /api/produtos?limit=1 ---"
curl -s "$API/api/produtos?limit=1" | head -c 500
echo
echo
echo "--- /api/produtores ---"
curl -s "$API/api/produtores" | head -c 500
echo
echo
echo "--- /api/cestas ---"
curl -s "$API/api/cestas" | head -c 500
echo
echo
echo "--- /api/zonas-entrega ---"
curl -s "$API/api/zonas-entrega" | head -c 500
echo
echo

# Collect first IDs (if any) for detail-page tests
PRODUCT_ID=$(curl -s "$API/api/produtos?limit=1" | grep -oE '"id":"[^"]+' | head -1 | cut -d'"' -f4)
PRODUCER_ID=$(curl -s "$API/api/produtores" | grep -oE '"id":"[^"]+' | head -1 | cut -d'"' -f4)
BASKET_ID=$(curl -s "$API/api/cestas" | grep -oE '"id":"[^"]+' | head -1 | cut -d'"' -f4)
echo "Sample IDs:"
echo "  product:  ${PRODUCT_ID:-<none>}"
echo "  producer: ${PRODUCER_ID:-<none>}"
echo "  basket:   ${BASKET_ID:-<none>}"
echo

echo
echo "============================================================"
echo "  PAGE SMOKE-TESTS"
echo "============================================================"
echo

probe() {
  local label="$1"
  local path="$2"
  local accept="${3:-200,307,302}"
  # -L would follow redirects — we don't, so we can see auth gates.
  local code=$(curl -s -o /dev/null -w "%{http_code}" "$FRONT$path")
  IFS=',' read -ra OK_CODES <<< "$accept"
  local ok="✗"
  for c in "${OK_CODES[@]}"; do
    if [ "$code" = "$c" ]; then ok="✓"; break; fi
  done
  printf "  %s %-40s %s\n" "$ok" "$path" "$code"
}

# Static / public pages
probe "home"           "/"
probe "produtos list"  "/produtos"
probe "produtos filtered" "/produtos?busca=alf"
probe "produtos organic"  "/produtos?organico=1"
probe "produtores list" "/produtores"
probe "cestas list"    "/cestas"
probe "sobre"          "/sobre"

# Cart / checkout
probe "carrinho"       "/carrinho"
probe "checkout"       "/checkout" "200,307"

# Auth pages
probe "login"          "/conta/login"
probe "cadastro"       "/conta/cadastro"
probe "conta (auth required)" "/conta" "200,307"

# Detail pages (only if we have IDs)
if [ -n "$PRODUCT_ID" ]; then
  probe "produto detail" "/produtos/$PRODUCT_ID"
fi
if [ -n "$PRODUCER_ID" ]; then
  probe "produtor detail" "/produtores/$PRODUCER_ID"
fi
if [ -n "$BASKET_ID" ]; then
  probe "cesta detail" "/cestas/$BASKET_ID"
fi

echo
echo "============================================================"
echo "  DONE"
echo "============================================================"
