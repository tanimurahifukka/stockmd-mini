#!/usr/bin/env bash
# Sandbox reset: destroys local DB and volumes. Medium risk — requires --yes.
set -euo pipefail

cd "$(dirname "$0")/../.."

want_yes=0
want_reup=0
for arg in "$@"; do
  case "$arg" in
    --yes) want_yes=1 ;;
    --reup) want_reup=1 ;;
    -h|--help)
      cat <<'USAGE'
Usage: scripts/sandbox/reset.sh [--yes] [--reup]
  --yes    Actually perform the reset (destroys local DB and volumes).
  --reup   After reset, also run up.sh.
USAGE
      exit 0
      ;;
  esac
done

if [ "$want_yes" -ne 1 ]; then
  cat >&2 <<'MSG'
reset.sh would:
  - stop and remove containers (`docker compose down -v`)
  - delete attached volumes (your local DB will be wiped)
  - stop Supabase local (if running)
  - clear .agent/runtime/sandbox-state.json sandbox.services

This is a Medium-risk operation. Refusing to run without --yes.
MSG
  exit 1
fi

echo "[reset] docker compose down -v"
docker compose down -v

if command -v supabase >/dev/null 2>&1; then
  echo "[reset] supabase stop --no-backup"
  supabase stop --no-backup >/dev/null 2>&1 || true
fi


# Wipe runtime services list
python3 - <<'PY' || true
import json, os, datetime
p = os.path.join(".agent", "runtime", "sandbox-state.json")
state = {"schema_version": "1.0", "sandbox": {}}
if os.path.exists(p):
    with open(p, "r", encoding="utf-8") as fh:
        state = json.load(fh)
state.setdefault("sandbox", {})
state["sandbox"]["status"] = "stopped"
state["sandbox"]["services"] = []
state["sandbox"]["last_reset"] = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
os.makedirs(os.path.dirname(p), exist_ok=True)
with open(p, "w", encoding="utf-8") as fh:
    json.dump(state, fh, indent=2)
    fh.write("\n")
PY

# Log event
python3 - <<'PY' || true
import sys, os
sys.path.insert(0, os.path.join(os.getcwd(), "scripts", "evolution"))
try:
    import log_event
    log_event.main_cli([
        "--event-type", "sandbox_reset",
        "--category", "environment",
        "--subcategory", "sandbox_reset",
        "--message", "scripts/sandbox/reset.sh --yes",
        "--out-dir", ".agent/events",
        "--out-file", "sandbox-events.jsonl",
    ])
except Exception as exc:
    print(f"[reset] warn: could not log event: {exc}", file=sys.stderr)
PY

if [ "$want_reup" -eq 1 ]; then
  echo "[reset] re-up"
  exec bash scripts/sandbox/up.sh
fi

echo "[reset] done. sandbox is stopped."
