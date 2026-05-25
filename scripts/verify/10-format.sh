#!/usr/bin/env bash
# 10-format: best-effort format check. Graceful skip when tools are missing.
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ ! -d node_modules ]; then
  echo "  node_modules missing — skipping format check (run \`pnpm install\` first)"
  exit 0
fi
if command -v pnpm >/dev/null 2>&1 && pnpm exec prettier --version >/dev/null 2>&1; then
  pnpm exec prettier --check . --log-level warn || {
    echo "  FAIL: prettier reports formatting issues. Run \`pnpm exec prettier --write .\`" >&2
    exit 1
  }
else
  echo "  prettier not available in node_modules — skipping format check"
fi


echo "  10-format: ok"
