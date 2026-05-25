#!/usr/bin/env bash
# 30-unit: run unit tests. Graceful skip when no test runner is configured.
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ ! -f package.json ] || ! grep -q '"test"' package.json; then
  echo "  no test script in package.json — skipping"
  exit 0
fi
if [ ! -d node_modules ]; then
  echo "  node_modules missing — skipping unit tests (run \`pnpm install\` first)"
  exit 0
fi
if command -v pnpm >/dev/null 2>&1; then
  pnpm test || { echo "  FAIL: pnpm test" >&2; exit 1; }
elif command -v npm >/dev/null 2>&1; then
  npm test || { echo "  FAIL: npm test" >&2; exit 1; }
else
  echo "  no node package manager available — skipping"
fi


echo "  30-unit: ok"
