#!/usr/bin/env python3
"""Append an event to a JSONL file under .agent/events/.

Importable as a module (use `main_cli(args)`) and runnable as a CLI.
Pure stdlib. Applies the privacy redactor before writing.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import re
import sys
import uuid
from pathlib import Path


DEFAULT_OUT_DIR = Path(".agent/events")
SECRET_RE = re.compile(r"[A-Za-z0-9+/=_-]{24,}")


def _now_iso() -> str:
    return _dt.datetime.now().astimezone().isoformat(timespec="seconds")


def _new_event_id() -> str:
    return "evt_" + uuid.uuid4().hex[:16]


def _redact(value: str) -> tuple[str, bool]:
    """Replace any high-entropy substring with [REDACTED]. Returns (new, hit)."""
    if not value:
        return value, False

    hit = False

    def sub(m: re.Match[str]) -> str:
        nonlocal hit
        token = m.group(0)
        if _is_low_entropy(token):
            return token
        hit = True
        return "[REDACTED]"

    return SECRET_RE.sub(sub, value), hit


_HEX_RE = re.compile(r"^[0-9a-fA-F]+$")
_UUID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")


def _is_low_entropy(token: str) -> bool:
    if _UUID_RE.match(token):
        return True
    if _HEX_RE.match(token) and len(token) in (32, 40, 64):
        return True
    return False


def _open_for_append(path: Path) -> "object":
    path.parent.mkdir(parents=True, exist_ok=True)
    return path.open("a", encoding="utf-8")


def build_event(args: argparse.Namespace) -> dict:
    message, redacted = _redact(args.message or "")
    event: dict = {
        "schema_version": "1.0",
        "event_id": _new_event_id(),
        "ts": _now_iso(),
        "session_id": args.session_id,
        "run_id": args.run_id,
        "project": args.project,
        "event": args.event_type,
        "task_id": args.task_id,
        "module": args.module,
        "phase": args.phase,
        "agent": args.agent,
        "model": args.model,
        "category": args.category,
        "subcategory": args.subcategory,
        "message": message,
        "privacy": {
            "contains_secret": redacted,
            "contains_user_data": False,
            "redaction_applied": redacted,
        },
    }
    if args.confidence is not None:
        event["confidence"] = args.confidence
    if args.verifier_state:
        event["verifier_state"] = args.verifier_state
    if args.failed_verifier:
        event["failed_verifier"] = args.failed_verifier
    if args.lesson_candidate:
        event.setdefault("lesson", {})["lesson_candidate"] = args.lesson_candidate
    if args.extra:
        try:
            extra = json.loads(args.extra)
            if isinstance(extra, dict):
                # --extra wins; CLI sets defaults.
                _deep_update(event, extra)
        except json.JSONDecodeError:
            print(
                f"warn: --extra is not valid JSON, ignoring: {args.extra}",
                file=sys.stderr,
            )
    return event


def _deep_update(dst: dict, src: dict) -> None:
    for k, v in src.items():
        if isinstance(v, dict) and isinstance(dst.get(k), dict):
            _deep_update(dst[k], v)
        else:
            dst[k] = v


def write_event(event: dict, out_dir: Path, out_file: str) -> Path:
    target = out_dir / out_file
    with _open_for_append(target) as fh:
        fh.write(json.dumps(event, ensure_ascii=False))
        fh.write("\n")
    return target


def _build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Append an event to a JSONL log.")
    p.add_argument("--event-type", required=True, help="e.g. agent_stopped")
    p.add_argument("--session-id", default=None, help="agent session identifier")
    p.add_argument("--run-id", default=None, help="task run identifier")
    p.add_argument("--project", default=None)
    p.add_argument("--task-id", default=None)
    p.add_argument("--module", default=None)
    p.add_argument("--phase", default=None)
    p.add_argument("--agent", default=None)
    p.add_argument("--model", default=None)
    p.add_argument("--category", default=None)
    p.add_argument("--subcategory", default=None)
    p.add_argument("--confidence", type=float, default=None, help="0.0-1.0 agent confidence")
    p.add_argument(
        "--verifier-state",
        default=None,
        choices=("passing", "failing", "unknown"),
    )
    p.add_argument("--failed-verifier", default=None, help="e.g. 40-crud-coverage.sh")
    p.add_argument("--lesson-candidate", default=None, help="short reusable lesson string")
    p.add_argument("--message", default="")
    p.add_argument("--extra", default=None, help="JSON object merged into the event")
    p.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    p.add_argument("--out-file", default="metrics.jsonl")
    p.add_argument("--print", action="store_true", help="also print the event to stdout")
    return p


def main_cli(argv: list[str]) -> int:
    args = _build_parser().parse_args(argv)
    event = build_event(args)
    out_dir = Path(args.out_dir)
    target = write_event(event, out_dir, args.out_file)
    if args.print:
        print(json.dumps(event, indent=2, ensure_ascii=False))
    else:
        print(f"logged {event['event_id']} to {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main_cli(sys.argv[1:]))
