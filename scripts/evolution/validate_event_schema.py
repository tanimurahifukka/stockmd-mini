#!/usr/bin/env python3
"""Light JSON schema validator for the event files.

Pure stdlib. Only checks `required` and `type` (string/number/boolean/integer/
array/object/null and `enum`). Enough to catch malformed events without a
jsonschema dependency.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


_TYPE_MAP = {
    "string": str,
    "integer": int,
    "number": (int, float),
    "boolean": bool,
    "array": list,
    "object": dict,
    "null": type(None),
}


def _check_type(value: Any, expected: Any) -> bool:
    if isinstance(expected, list):
        return any(_check_type(value, e) for e in expected)
    if expected == "null":
        return value is None
    py = _TYPE_MAP.get(expected)
    if py is None:
        return True
    if py is int and isinstance(value, bool):
        return False
    return isinstance(value, py)


def validate_one(event: dict, schema: dict) -> list[str]:
    errors: list[str] = []
    for field in schema.get("required", []):
        if field not in event:
            errors.append(f"missing required field: {field}")
    for name, spec in schema.get("properties", {}).items():
        if name not in event:
            continue
        value = event[name]
        if "const" in spec:
            if value != spec["const"]:
                errors.append(f"{name}: expected const {spec['const']!r}, got {value!r}")
            continue
        if "enum" in spec:
            if value not in spec["enum"]:
                errors.append(f"{name}: {value!r} not in enum {spec['enum']}")
            continue
        if "type" in spec:
            if not _check_type(value, spec["type"]):
                errors.append(f"{name}: type mismatch (expected {spec['type']}, got {type(value).__name__})")
    return errors


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--schema", required=True)
    p.add_argument("--jsonl", required=True, help="path to a .jsonl file")
    p.add_argument("--limit", type=int, default=0, help="check only the last N lines")
    args = p.parse_args()

    schema = json.loads(Path(args.schema).read_text(encoding="utf-8"))
    lines = Path(args.jsonl).read_text(encoding="utf-8").splitlines()
    if args.limit > 0:
        lines = lines[-args.limit :]

    total = 0
    bad = 0
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue
        total += 1
        try:
            event = json.loads(line)
        except json.JSONDecodeError as exc:
            bad += 1
            print(f"line {i}: invalid JSON ({exc})", file=sys.stderr)
            continue
        errors = validate_one(event, schema)
        if errors:
            bad += 1
            for err in errors:
                print(f"line {i}: {err}", file=sys.stderr)

    print(f"checked {total} events, {bad} with errors")
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
