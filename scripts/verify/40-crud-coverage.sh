#!/usr/bin/env bash
# 40-crud-coverage: every resource in resources.md must be planned in
# feature_list.json and task_queue.json. When VERIFY_REQUIRE_ROUTES=1 (the
# default), also enforce that each resource's Next.js API route files exist
# and export the expected HTTP handlers.
#
# A freshly bootstrapped skeleton sets VERIFY_REQUIRE_ROUTES=0 (the smoke
# test does this) so the project is not red on first generation.
set -euo pipefail

cd "$(dirname "$0")/../.."

python3 - <<'PY'
import json
import os
import re
import sys

RESOURCES_MD = "resources.md"
FEATURE_LIST = "feature_list.json"
TASK_QUEUE = "task_queue.json"
REQUIRE_ROUTES = os.environ.get("VERIFY_REQUIRE_ROUTES", "1") == "1"

if not os.path.exists(RESOURCES_MD):
    print("  no resources.md — skipping CRUD coverage")
    sys.exit(0)

with open(RESOURCES_MD, encoding="utf-8") as fh:
    text = fh.read()

# Anchor the table on the "## Resources" heading so the schema explainer
# table earlier in the file is ignored.
in_section = False
in_table = False
header_seen = False
resources = []
for line in text.splitlines():
    stripped = line.strip()
    if stripped.startswith("## Resources"):
        in_section = True
        in_table = False
        header_seen = False
        continue
    if in_section and stripped.startswith("## "):
        break
    if not in_section:
        continue
    if stripped.startswith("|"):
        if not header_seen:
            header_seen = True
            continue
        if set(stripped.replace("|", "").strip()) <= set("- "):
            in_table = True
            continue
        if in_table:
            cols = [c.strip().strip("`") for c in stripped.strip("|").split("|")]
            if cols and cols[0]:
                resources.append(cols[0])

if not resources:
    print("  resources.md has no resources rows — skipping")
    sys.exit(0)

print(f"  resources: {', '.join(resources)}")

try:
    with open(FEATURE_LIST, encoding="utf-8") as fh:
        feature_list = json.load(fh)
except (FileNotFoundError, json.JSONDecodeError) as exc:
    print(f"  FAIL: cannot read {FEATURE_LIST}: {exc}", file=sys.stderr)
    sys.exit(1)

declared = {r.get("name") for r in feature_list.get("resources", []) if isinstance(r, dict)}
missing_in_features = sorted(set(resources) - declared)
if missing_in_features:
    print(f"  FAIL: feature_list.json missing resources: {missing_in_features}", file=sys.stderr)
    sys.exit(1)

try:
    with open(TASK_QUEUE, encoding="utf-8") as fh:
        task_queue = json.load(fh)
except (FileNotFoundError, json.JSONDecodeError) as exc:
    print(f"  FAIL: cannot read {TASK_QUEUE}: {exc}", file=sys.stderr)
    sys.exit(1)

tasks = task_queue.get("tasks", [])
have = {(t.get("resource"), t.get("operation")) for t in tasks if t.get("resource")}
need = [(r, op) for r in resources for op in ("create", "list", "read", "update", "delete")]
missing_tasks = [pair for pair in need if pair not in have]
if missing_tasks:
    print(f"  WARN: task_queue.json missing CRUDL tasks: {missing_tasks}")


# ---------------------------------------------------------------------------
# Route file + handler check (Next.js stack overlay)
# ---------------------------------------------------------------------------

def to_api_path(resource: str) -> str:
    """purchase_orders -> purchase-orders; stocks -> stocks."""
    return resource.replace("_", "-")


def file_has_handler(path: str, verb: str) -> bool:
    if not os.path.isfile(path):
        return False
    try:
        with open(path, encoding="utf-8") as fh:
            body = fh.read()
    except OSError:
        return False
    return re.search(rf"export\s+async\s+function\s+{verb}\b", body) is not None


api_dir = os.path.join("src", "app", "api")
if not os.path.isdir(api_dir):
    print("  no src/app/api — skipping route checks (not a Next.js stack?)")
    print("  40-crud-coverage: ok")
    sys.exit(0)

route_failures: list[str] = []
route_notes: list[str] = []

LIST_VERBS = ("GET", "POST")
ID_VERBS = ("GET", "PATCH", "DELETE")

for r in resources:
    api_name = to_api_path(r)
    list_route = os.path.join(api_dir, api_name, "route.ts")
    id_route = os.path.join(api_dir, api_name, "[id]", "route.ts")

    list_exists = os.path.isfile(list_route)
    id_exists = os.path.isfile(id_route)

    if not list_exists or not id_exists:
        missing = [p for p, e in ((list_route, list_exists), (id_route, id_exists)) if not e]
        msg = f"resource '{r}' missing route files: {missing}"
        if REQUIRE_ROUTES:
            route_failures.append(msg)
        else:
            route_notes.append(msg)
        continue

    missing_handlers: list[str] = []
    for verb in LIST_VERBS:
        if not file_has_handler(list_route, verb):
            missing_handlers.append(f"{list_route}:{verb}")
    for verb in ID_VERBS:
        if not file_has_handler(id_route, verb):
            missing_handlers.append(f"{id_route}:{verb}")
    if missing_handlers:
        msg = f"resource '{r}' missing handlers: {missing_handlers}"
        if REQUIRE_ROUTES:
            route_failures.append(msg)
        else:
            route_notes.append(msg)

for note in route_notes:
    print(f"  NOTE: {note}")

if route_failures:
    for f in route_failures:
        print(f"  FAIL: {f}", file=sys.stderr)
    print(
        "  (set VERIFY_REQUIRE_ROUTES=0 to downgrade these to NOTE, "
        "e.g. for a freshly bootstrapped skeleton)",
        file=sys.stderr,
    )
    sys.exit(1)

print("  40-crud-coverage: ok")
PY
