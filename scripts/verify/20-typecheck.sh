#!/usr/bin/env bash
# 20-typecheck: typecheck the project. Graceful skip when toolchain missing.
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ ! -f tsconfig.json ]; then
  echo "  no tsconfig.json — skipping typecheck"
  exit 0
fi
if [ ! -d node_modules ]; then
  echo "  node_modules missing — run \`pnpm install\` (or \`npm install\`) first; skipping typecheck"
  exit 0
fi
if command -v pnpm >/dev/null 2>&1 && pnpm exec tsc --version >/dev/null 2>&1; then
  pnpm exec tsc --noEmit 2>&1 || { echo "  FAIL: tsc --noEmit" >&2; exit 1; }
elif command -v npx >/dev/null 2>&1 && npx --no-install tsc --version >/dev/null 2>&1; then
  npx --no-install tsc --noEmit 2>&1 || { echo "  FAIL: tsc --noEmit" >&2; exit 1; }
else
  echo "  tsc not available in node_modules — skipping typecheck"
fi


echo "  20-typecheck: ok"
