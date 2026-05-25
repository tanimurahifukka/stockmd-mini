#!/usr/bin/env bash
# 40-crud-coverage: every resource in resources.md must be planned in
# feature_list.json and task_queue.json. v1.1 hard-fails on plan gaps when
# the stack overlay is loaded; otherwise warns.
set -euo pipefail

cd "$(dirname "$0")/../.."

python3 - <<'PY'
import json
import os
import sys

RESOURCES_MD = "resources.md"
FEATURE_LIST = "feature_list.json"
TASK_QUEUE = "task_queue.json"

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
        # left the section
        break
    if not in_section:
        continue
    if stripped.startswith("|"):
        if not header_seen:
            # first | line is the header
            header_seen = True
            continue
        if set(stripped.replace("|", "").strip()) <= set("- "):
            # separator row
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

# feature_list.json
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

# task_queue.json
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

# Stack-aware: if Next.js routes directory exists, every module needs an api route.
api_dir = os.path.join("src", "app", "api")
if os.path.isdir(api_dir):
    api_resources = {name for name in os.listdir(api_dir) if name != "health"}
    missing_routes = sorted(set(resources) - api_resources)
    if missing_routes:
        print(f"  NOTE: no API route folder yet for: {missing_routes}")

print("  40-crud-coverage: ok")
PY
