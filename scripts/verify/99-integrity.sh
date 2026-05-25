#!/usr/bin/env bash
# 99-integrity: protected files must exist, be non-empty, and not be stubbed
# to a no-op. See docs/verifier-integrity-policy.md.
set -euo pipefail

cd "$(dirname "$0")/../.."

if [ ! -f .agent/protected-files.json ]; then
  echo "  FAIL: .agent/protected-files.json is missing" >&2
  exit 1
fi

python3 - <<'PY'
import json, os, sys, re

with open(".agent/protected-files.json", encoding="utf-8") as fh:
    data = json.load(fh)

paths = data.get("paths", [])
failed = []
for path in paths:
    if not os.path.exists(path):
        failed.append((path, "missing"))
        continue
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            body = fh.read()
    except Exception as exc:
        failed.append((path, f"unreadable: {exc}"))
        continue
    if not body.strip():
        failed.append((path, "empty"))
        continue
    # detect a no-op verifier stub
    if path.startswith("scripts/verify"):
        non_comment = [
            line.strip()
            for line in body.splitlines()
            if line.strip() and not line.strip().startswith("#")
        ]
        if non_comment and re.fullmatch(r"exit\s+0", non_comment[0] if non_comment else ""):
            failed.append((path, "starts with `exit 0` — verifier stub"))

if failed:
    for path, reason in failed:
        print(f"  FAIL: {path} ({reason})", file=sys.stderr)
    sys.exit(1)

print(f"  99-integrity: ok ({len(paths)} protected files)")
PY
