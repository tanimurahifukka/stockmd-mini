#!/usr/bin/env bash
# Sandbox logs: paginated logs for a service.
set -euo pipefail

cd "$(dirname "$0")/../.."

service="${1:-}"
lines="${LOG_TAIL:-200}"

if [ -z "$service" ]; then
  echo "Usage: scripts/sandbox/logs.sh <service> [tail]" >&2
  echo "       LOG_TAIL=500 scripts/sandbox/logs.sh app" >&2
  exit 2
fi

if [ "${#@}" -ge 2 ]; then
  lines="$2"
fi

docker compose logs --tail "$lines" "$service"
