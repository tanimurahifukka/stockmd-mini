#!/usr/bin/env bash
# Live API smoke for all CRUDL resources. Requires:
#   - sandbox up (bash scripts/sandbox/up.sh)
#   - app reachable on 127.0.0.1:3000
#
# Each resource: create, list, read, patch, delete, delete-twice (404).
# Cleans up after itself (soft-delete) so it's safe to re-run.
set -euo pipefail

BASE="${BASE:-http://127.0.0.1:3000}"

ok()   { printf "  [ok]   %s\n" "$1"; }
fail() { printf "  [fail] %s\n" "$1" >&2; exit 1; }

expect_status() {
  local got="$1" want="$2" label="$3"
  if [ "$got" = "$want" ]; then ok "$label: $got"; else fail "$label: expected $want, got $got"; fi
}

# Each call returns "<http-status>\n<body>" with `-w '%{http_code}'`
call() {
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sS -X "$method" "$BASE$path" \
      -H 'Content-Type: application/json' -d "$body" -w '%{http_code}'
  else
    curl -sS -X "$method" "$BASE$path" -w '%{http_code}'
  fi
}

# A response body is everything except the final 3 digits (http code).
body_of() { echo "${1:0:${#1}-3}"; }
code_of() { echo "${1: -3}"; }

ts="$(date +%s)"

echo "== health =="
r=$(call GET /api/health)
expect_status "$(code_of "$r")" "200" "GET /api/health"

echo "== suppliers =="
SLUG="api-smoke-supplier-$ts"
r=$(call POST /api/suppliers "{\"name\":\"API Smoke Supplier\",\"slug\":\"$SLUG\"}")
expect_status "$(code_of "$r")" "201" "POST /api/suppliers"
SUP_ID=$(echo "$(body_of "$r")" | python3 -c "import json,sys;print(json.load(sys.stdin)['supplier']['id'])")

echo "== stocks =="
SKU="API-SMOKE-$ts"
r=$(call POST /api/stocks "{\"sku\":\"$SKU\",\"name\":\"API smoke stock\"}")
expect_status "$(code_of "$r")" "201" "POST /api/stocks"
STOCK_ID=$(echo "$(body_of "$r")" | python3 -c "import json,sys;print(json.load(sys.stdin)['stock']['id'])")

echo "== lots =="
LOT_CODE="API-LOT-$ts"
r=$(call POST /api/lots "{\"stock_id\":\"$STOCK_ID\",\"lot_code\":\"$LOT_CODE\",\"quantity\":5}")
expect_status "$(code_of "$r")" "201" "POST /api/lots"
LOT_ID=$(echo "$(body_of "$r")" | python3 -c "import json,sys;print(json.load(sys.stdin)['lot']['id'])")

echo "== purchase_orders =="
PO_NUM="API-PO-$ts"
r=$(call POST /api/purchase-orders "{\"po_number\":\"$PO_NUM\",\"supplier_id\":\"$SUP_ID\",\"total_amount\":100}")
expect_status "$(code_of "$r")" "201" "POST /api/purchase-orders"
PO_ID=$(echo "$(body_of "$r")" | python3 -c "import json,sys;print(json.load(sys.stdin)['purchase_order']['id'])")

echo "== nfc_tags =="
# Build a 14-hex UID with enough entropy that re-runs in the same minute do
# not collide on the unique constraint (ts ^ pid -> hex).
TAG_UID=$(printf "04AABBCC%010X" "$(( (ts ^ $$) & 0xFFFFFFFFFF ))")
r=$(call POST /api/nfc-tags "{\"uid\":\"$TAG_UID\"}")
expect_status "$(code_of "$r")" "201" "POST /api/nfc-tags"
TAG_ID=$(echo "$(body_of "$r")" | python3 -c "import json,sys;print(json.load(sys.stdin)['nfc_tag']['id'])")

echo
echo "== list each resource =="
for path in /api/stocks /api/lots /api/suppliers /api/purchase-orders /api/nfc-tags; do
  r=$(call GET "$path?limit=1")
  expect_status "$(code_of "$r")" "200" "GET $path"
done

echo
echo "== read + patch + delete each id =="
# Parallel arrays (bash 3.2 compatible — no associative arrays on macOS default).
PATHS=( "/api/stocks"  "/api/lots"  "/api/suppliers"  "/api/purchase-orders"  "/api/nfc-tags" )
IDS=(   "$STOCK_ID"    "$LOT_ID"    "$SUP_ID"         "$PO_ID"                "$TAG_ID"       )

for i in 0 1 2 3 4; do
  path="${PATHS[$i]}"
  id="${IDS[$i]}"
  r=$(call GET "$path/$id");                     expect_status "$(code_of "$r")" "200" "GET $path/{id}"
  r=$(call PATCH "$path/$id" '{"notes":"smoke-patched"}')
  expect_status "$(code_of "$r")" "200" "PATCH $path/{id}"
  r=$(call DELETE "$path/$id");                  expect_status "$(code_of "$r")" "200" "DELETE $path/{id}"
  r=$(call DELETE "$path/$id");                  expect_status "$(code_of "$r")" "404" "DELETE $path/{id} (already deleted)"
done

echo
echo "api-smoke: PASS"
