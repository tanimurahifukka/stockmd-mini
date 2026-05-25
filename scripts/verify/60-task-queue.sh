#!/usr/bin/env bash
# 60-task-queue: task_queue.json is valid JSON with unique task IDs.
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ ! -f task_queue.json ]; then
  echo "  no task_queue.json — fail"
  exit 1
fi

python3 - <<'PY'
import json, sys

try:
    with open("task_queue.json", encoding="utf-8") as fh:
        data = json.load(fh)
except json.JSONDecodeError as exc:
    print(f"  FAIL: invalid JSON: {exc}", file=sys.stderr)
    sys.exit(1)

tasks = data.get("tasks", [])
if not isinstance(tasks, list):
    print("  FAIL: tasks is not a list", file=sys.stderr)
    sys.exit(1)

seen = set()
for t in tasks:
    if not isinstance(t, dict):
        print(f"  FAIL: task is not an object: {t!r}", file=sys.stderr)
        sys.exit(1)
    tid = t.get("id")
    if not tid:
        print(f"  FAIL: task missing id: {t!r}", file=sys.stderr)
        sys.exit(1)
    if tid in seen:
        print(f"  FAIL: duplicate task id: {tid}", file=sys.stderr)
        sys.exit(1)
    seen.add(tid)

# Cross-check: every task that names a resource must have that resource in
# feature_list.json (if it exists).
try:
    with open("feature_list.json", encoding="utf-8") as fh:
        fl = json.load(fh)
    declared = {r.get("name") for r in fl.get("resources", []) if isinstance(r, dict)}
    for t in tasks:
        r = t.get("resource")
        if r and r not in declared:
            print(f"  FAIL: task {t.get('id')} references unknown resource {r!r}", file=sys.stderr)
            sys.exit(1)
except FileNotFoundError:
    pass

print(f"  60-task-queue: ok ({len(tasks)} tasks)")
PY
