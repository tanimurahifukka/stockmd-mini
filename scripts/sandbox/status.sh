#!/usr/bin/env bash
# Sandbox status: print current state, optionally as JSON.
#
# "healthy" requires both:
#   - every compose service is `running`, and
#   - the Docker healthcheck (when defined) reports `healthy`, and
#   - healthcheck.sh --quiet returns 0 (catches DB readiness / app /api/health).
set -euo pipefail

cd "$(dirname "$0")/../.."

want_json=0
for arg in "$@"; do
  case "$arg" in
    --json) want_json=1 ;;
    -h|--help)
      echo "Usage: scripts/sandbox/status.sh [--json]"
      exit 0
      ;;
  esac
done

# Run healthcheck.sh quietly to get the authoritative health verdict.
# Stash exit code; we still want to emit status even if unhealthy.
hc_exit=0
bash scripts/sandbox/healthcheck.sh --quiet >/dev/null 2>&1 || hc_exit=$?

python3 - "$want_json" "$hc_exit" <<'PY'
import json, os, subprocess, sys, datetime

want_json = sys.argv[1] == "1"
hc_exit = int(sys.argv[2])
project = os.path.basename(os.getcwd())

state = {
    "schema_version": "1.0",
    "project": project,
    "sandbox": {
        "status": "unknown",
        "provider": "unknown",
        "services": [],
        "last_healthcheck": None,
    },
}

# Detect docker daemon
try:
    subprocess.check_output(["docker", "info"], stderr=subprocess.DEVNULL, timeout=5)
    state["sandbox"]["provider"] = "docker-desktop"
except Exception:
    state["sandbox"]["status"] = "stopped"

services: list[dict] = []

# Detect compose services
if state["sandbox"]["status"] != "stopped":
    try:
        out = subprocess.check_output(
            ["docker", "compose", "ps", "--format", "json"],
            stderr=subprocess.DEVNULL,
            timeout=10,
        ).decode("utf-8", errors="replace").strip()
        if out:
            try:
                data = json.loads(out)
                if isinstance(data, dict):
                    data = [data]
            except json.JSONDecodeError:
                data = []
                for line in out.splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        data.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
            for entry in data:
                name = entry.get("Service") or entry.get("Name") or "?"
                status = entry.get("State") or entry.get("Status") or "?"
                health = entry.get("Health") or ""
                port = 0
                pub = entry.get("Publishers") or []
                if pub and isinstance(pub, list):
                    try:
                        port = int(pub[0].get("PublishedPort") or 0)
                    except Exception:
                        port = 0
                services.append({
                    "name": name,
                    "status": status,
                    "health": health,
                    "port": port,
                })
    except Exception:
        pass

state["sandbox"]["services"] = services


def service_is_running(s: dict) -> bool:
    return (s.get("status") or "").lower() == "running"


def service_is_healthy(s: dict) -> bool:
    """Running, AND either has no Docker healthcheck or reports healthy."""
    if not service_is_running(s):
        return False
    health = (s.get("health") or "").lower()
    return health in ("", "healthy")


# Final verdict combines compose state + healthcheck.sh result.
if state["sandbox"]["status"] != "stopped":
    if not services:
        state["sandbox"]["status"] = "stopped"
    elif not all(service_is_running(s) for s in services):
        state["sandbox"]["status"] = "starting"
    elif not all(service_is_healthy(s) for s in services):
        state["sandbox"]["status"] = "unhealthy"
    elif hc_exit != 0:
        # compose says ok but healthcheck.sh (db readiness / app /api/health)
        # disagrees — trust the deeper check.
        state["sandbox"]["status"] = "unhealthy"
    else:
        state["sandbox"]["status"] = "healthy"

state["sandbox"]["last_healthcheck"] = datetime.datetime.now().astimezone().isoformat(timespec="seconds")

if want_json:
    print(json.dumps(state, indent=2))
else:
    s = state["sandbox"]
    print(f"sandbox: {s['status']} (provider={s['provider']})")
    if s["services"]:
        for svc in s["services"]:
            print(f"  - {svc['name']:20s}  {svc['status']:8s}  {svc.get('health', ''):10s}  :{svc.get('port', 0)}")
    else:
        print("  (no services running)")
PY
