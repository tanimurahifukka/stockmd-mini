#!/usr/bin/env python3
"""Thin wrapper around log_event.py for task-success events."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import log_event  # noqa: E402


def main() -> int:
    p = argparse.ArgumentParser(description="Log a task success event.")
    p.add_argument("--project", default=None)
    p.add_argument("--session-id", default=None)
    p.add_argument("--run-id", default=None)
    p.add_argument("--task-id", required=True)
    p.add_argument("--module", default=None)
    p.add_argument("--phase", default=None)
    p.add_argument("--agent", default=None)
    p.add_argument("--model", default=None)
    p.add_argument("--elapsed-min", type=float, default=None)
    p.add_argument("--commits", type=int, default=None)
    p.add_argument("--what-worked", default="")
    p.add_argument("--reusable-hint", default="")
    p.add_argument("--lesson-candidate", default=None)
    p.add_argument("--message", default="")
    p.add_argument("--out-dir", default=".agent/events")
    p.add_argument("--out-file", default="success-events.jsonl")
    p.add_argument("--print", action="store_true")
    args = p.parse_args()

    extra = {
        "elapsed_min": args.elapsed_min,
        "commits_created": args.commits,
        "verifier_passed": [],
        "success_pattern": {
            "what_worked": args.what_worked,
            "reusable_hint": args.reusable_hint,
        },
        "lesson": {
            "lesson_candidate": args.lesson_candidate or args.what_worked or args.message,
            "lesson_scope": "project",
            "promotion_candidate": None,
        },
    }
    forwarded = [
        "--event-type", "task_completed",
        "--task-id", args.task_id,
        "--verifier-state", "passing",
        "--out-dir", args.out_dir,
        "--out-file", args.out_file,
        "--extra", json.dumps(extra),
        "--message", args.message,
    ]
    for k, v in (
        ("--project", args.project),
        ("--session-id", args.session_id),
        ("--run-id", args.run_id),
        ("--module", args.module),
        ("--phase", args.phase),
        ("--agent", args.agent),
        ("--model", args.model),
    ):
        if v:
            forwarded += [k, v]
    if args.print:
        forwarded.append("--print")
    return log_event.main_cli(forwarded)


if __name__ == "__main__":
    sys.exit(main())
