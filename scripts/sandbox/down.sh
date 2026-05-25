#!/usr/bin/env bash
# Sandbox down: stop services without deleting data.
set -euo pipefail

cd "$(dirname "$0")/../.."

log() { printf "[down] %s\n" "$1"; }

if command -v supabase >/dev/null 2>&1; then
  log "supabase stop"
  supabase stop >/dev/null 2>&1 || true
fi


log "docker compose down"
docker compose down

# Update state file to reflect stopped sandbox.
python3 - <<'PY' || true
import json, os
state_path = os.path.join(".agent", "runtime", "sandbox-state.json")
state = {"schema_version": "1.0", "sandbox": {"status": "stopped", "services": []}}
try:
    if os.path.exists(state_path):
        with open(state_path, "r", encoding="utf-8") as fh:
            cur = json.load(fh)
        state = cur
        state.setdefault("sandbox", {})["status"] = "stopped"
        state["sandbox"]["services"] = []
    os.makedirs(os.path.dirname(state_path), exist_ok=True)
    with open(state_path, "w", encoding="utf-8") as fh:
        json.dump(state, fh, indent=2)
        fh.write("\n")
except Exception as exc:
    print(f"[down] warn: could not update sandbox-state.json: {exc}")
PY

log "sandbox stopped"
