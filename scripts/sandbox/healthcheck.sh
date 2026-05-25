#!/usr/bin/env bash
# Sandbox healthcheck: single decision point for "is the sandbox ready?".
set -euo pipefail

cd "$(dirname "$0")/../.."

wait=0
timeout=90
quiet=0
while [ $# -gt 0 ]; do
  case "$1" in
    --wait) wait=1 ;;
    --timeout) timeout="${2:-90}"; shift ;;
    --quiet) quiet=1 ;;
    -h|--help)
      echo "Usage: scripts/sandbox/healthcheck.sh [--wait] [--timeout N] [--quiet]"
      exit 0
      ;;
  esac
  shift
done

say() { [ "$quiet" -eq 1 ] || printf "[health] %s\n" "$1"; }
fail_say() { printf "[health] FAIL: %s\n" "$1" >&2; }

check_once() {
  # Compose-level health
  if command -v docker >/dev/null 2>&1; then
    ps_out=$(docker compose ps --format json 2>/dev/null || echo "")
    if [ -z "$ps_out" ]; then
      fail_say "no compose services running"
      return 60
    fi
  fi

  # Supabase local readiness
  if command -v supabase >/dev/null 2>&1; then
    if ! supabase status >/dev/null 2>&1; then
      fail_say "supabase status reports unhealthy"
      return 30
    fi
  fi

  # Postgres readiness (default Supabase local port 54322)
  if command -v pg_isready >/dev/null 2>&1; then
    if ! pg_isready -h 127.0.0.1 -p 54322 -q; then
      fail_say "postgres at 127.0.0.1:54322 not ready"
      return 31
    fi
  fi

  # App health
  if command -v curl >/dev/null 2>&1; then
    if ! curl -sf --max-time 3 http://127.0.0.1:3000/api/health >/dev/null; then
      fail_say "GET http://127.0.0.1:3000/api/health failed"
      return 60
    fi
  fi
  
  return 0
}

if [ "$wait" -eq 1 ]; then
  start=$(date +%s)
  while :; do
    if check_once; then
      say "healthy"
      exit 0
    fi
    now=$(date +%s)
    if [ $((now - start)) -ge "$timeout" ]; then
      fail_say "timeout after ${timeout}s"
      docker compose ps || true
      exit 60
    fi
    sleep 3
  done
else
  if check_once; then
    say "healthy"
    exit 0
  fi
  exit $?
fi
