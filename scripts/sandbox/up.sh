#!/usr/bin/env bash
# Sandbox up: full start sequence. Idempotent — running it twice is safe.
# Exit codes: see docs/sandbox-policy (10-19 docker, 20-29 ports, ...).
set -euo pipefail

cd "$(dirname "$0")/../.."

log()  { printf "[up] %s\n" "$1"; }
fail() { printf "[up] FAIL: %s\n" "$1" >&2; }

# 0. Idempotency: if the sandbox is already healthy, refresh state and exit.
# This avoids the "second run trips its own port check" problem.
if bash scripts/sandbox/healthcheck.sh --quiet >/dev/null 2>&1; then
  log "sandbox already healthy — refreshing state and exiting"
  bash scripts/sandbox/status.sh --json > .agent/runtime/sandbox-state.json 2>/dev/null || true
  exit 0
fi

# 1. Doctor
log "running doctor"
if ! bash scripts/sandbox/doctor.sh; then
  fail "doctor failed; not starting services"
  exit 10
fi

# 2. Env file
if [ ! -f .env ] && [ -f .env.example ]; then
  log "copying .env.example -> .env (local placeholders only)"
  # Strip values that look like secrets so the user is forced to fill them.
  awk -F= '
    /_KEY=|_SECRET=|_TOKEN=|_PASSWORD=/ {print $1"=changeme"; next}
    {print}
  ' .env.example > .env
fi

# 3. Compose up
log "docker compose up -d"
if ! docker compose up -d; then
  fail "docker compose up failed"
  exit 19
fi

# 4. Stack-specific extras
if command -v supabase >/dev/null 2>&1; then
  # Skip if Supabase local is already running.
  if supabase status >/dev/null 2>&1; then
    log "supabase already running — skipping start"
  else
    log "supabase start"
    if ! supabase start >/dev/null; then
      fail "supabase start failed"
      exit 30
    fi
  fi
fi


# 5. Healthcheck
log "waiting for services to become healthy"
if ! bash scripts/sandbox/healthcheck.sh --wait --timeout 90; then
  fail "healthcheck did not converge"
  exit 60
fi

# 6. Migrate and seed
log "running migrations"
if ! bash scripts/sandbox/migrate.sh; then
  fail "migration failed"
  exit 40
fi

log "running seed"
if ! bash scripts/sandbox/seed.sh; then
  fail "seed failed"
  exit 50
fi

# 7. Update sandbox-state.json (delegated to status.sh)
bash scripts/sandbox/status.sh --json > .agent/runtime/sandbox-state.json || true

# 8. Emit event
python3 - <<'PY' || true
import sys, os
sys.path.insert(0, os.path.join(os.getcwd(), "scripts", "evolution"))
try:
    import log_event
    log_event.main_cli([
        "--event-type", "sandbox_up",
        "--category", "environment",
        "--subcategory", "sandbox_started",
        "--message", "scripts/sandbox/up.sh completed",
        "--out-dir", ".agent/events",
        "--out-file", "sandbox-events.jsonl",
    ])
except Exception as exc:
    print(f"[up] warn: could not log sandbox_up event: {exc}", file=sys.stderr)
PY

log "sandbox up — ready"
