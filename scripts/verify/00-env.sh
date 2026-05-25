#!/usr/bin/env bash
# 00-env: verifier's first check — sandbox health and env hygiene.
#
# Strict by default: a stopped or unhealthy sandbox FAILS the verifier. The
# whole "verifier green = task done" contract depends on this. To run tests
# or CI without a live sandbox, set VERIFY_REQUIRE_SANDBOX=0 (the project's
# smoke tests already do this).
set -euo pipefail

cd "$(dirname "$0")/../.."

require_sandbox="${VERIFY_REQUIRE_SANDBOX:-1}"
state_path=".agent/runtime/sandbox-state.json"

if [ -x scripts/sandbox/status.sh ]; then
  if ! scripts/sandbox/status.sh --json > "$state_path" 2>/dev/null; then
    echo "  WARN: scripts/sandbox/status.sh failed; trusting cached $state_path" >&2
  fi
fi

status="unknown"
if [ -f "$state_path" ]; then
  status=$(python3 - <<PY
import json, sys
try:
    with open("$state_path", "r", encoding="utf-8") as fh:
        data = json.load(fh)
except Exception:
    print("unknown")
    sys.exit(0)
print(data.get("sandbox", {}).get("status", "unknown"))
PY
)
fi

echo "  sandbox status: $status (VERIFY_REQUIRE_SANDBOX=$require_sandbox)"

if [ "$require_sandbox" = "1" ] && [ "$status" != "healthy" ]; then
  echo "  FAIL: sandbox status is '$status' but VERIFY_REQUIRE_SANDBOX=1." >&2
  echo "        Run \`bash scripts/sandbox/up.sh\` first," >&2
  echo "        or set VERIFY_REQUIRE_SANDBOX=0 for offline/CI runs." >&2
  exit 1
fi

if [ ! -f .env.example ]; then
  echo "  FAIL: .env.example is missing" >&2
  exit 1
fi

# Light secret check on .env (only if it exists)
if [ -f .env ]; then
  if grep -E '=(sk-[A-Za-z0-9_-]{20,}|eyJ[A-Za-z0-9_-]{20,})' .env >/dev/null 2>&1; then
    echo "  WARN: .env appears to contain a real key. Make sure it's not committed."
  fi
  if [ -f .gitignore ] && ! grep -q '^\.env$' .gitignore; then
    echo "  FAIL: .env exists but is not in .gitignore" >&2
    exit 1
  fi
fi

echo "  00-env: ok"
