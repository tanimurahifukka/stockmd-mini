#!/usr/bin/env bash
# 70-api-smoke: opt-in live API smoke. Off by default so verify.sh stays cheap
# in offline/CI runs. When VERIFY_LIVE_API=1, delegates to tests/api-smoke.sh,
# which is expected to spin through every CRUDL verb of every resource against
# the running sandbox.
#
# Required preconditions when VERIFY_LIVE_API=1:
#   - bash scripts/sandbox/up.sh (or VERIFY_REQUIRE_SANDBOX takes care of it)
#   - tests/api-smoke.sh exists in the project tree
set -euo pipefail

cd "$(dirname "$0")/../.."

live="${VERIFY_LIVE_API:-0}"

if [ "$live" != "1" ]; then
  echo "  api smoke skipped; set VERIFY_LIVE_API=1 to run tests/api-smoke.sh"
  echo "  70-api-smoke: ok"
  exit 0
fi

if [ ! -f tests/api-smoke.sh ]; then
  echo "  FAIL: VERIFY_LIVE_API=1 but tests/api-smoke.sh is missing" >&2
  exit 1
fi

echo "  running tests/api-smoke.sh"
bash tests/api-smoke.sh || {
  echo "  FAIL: tests/api-smoke.sh exited non-zero" >&2
  exit 1
}

echo "  70-api-smoke: ok"
