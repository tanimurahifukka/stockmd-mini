#!/usr/bin/env python3
"""Thin wrapper around log_event.py for stop events."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import log_event  # noqa: E402


def main() -> int:
    p = argparse.ArgumentParser(description="Log a stop event.")
    p.add_argument("--project", default=None)
    p.add_argument("--session-id", default=None)
    p.add_argument("--run-id", default=None)
    p.add_argument("--task-id", default=None)
    p.add_argument("--module", default=None)
    p.add_argument("--phase", default=None)
    p.add_argument("--agent", default=None)
    p.add_argument("--model", default=None)
    p.add_argument("--category", required=True, help="top-level category")
    p.add_argument("--subcategory", default=None)
    p.add_argument("--severity", default="medium", choices=["low", "medium", "high", "critical"])
    p.add_argument("--confidence", type=float, default=None)
    p.add_argument("--verifier-state", default=None, choices=["passing", "failing", "unknown"])
    p.add_argument("--failed-verifier", default=None)
    p.add_argument("--lesson-candidate", default=None)
    p.add_argument("--message", default="")
    p.add_argument("--out-dir", default=".agent/events")
    p.add_argument("--out-file", default="stop-events.jsonl")
    p.add_argument("--print", action="store_true")
    args = p.parse_args()

    extra = {
        "stop_category": args.category,
        "stop_subcategory": args.subcategory,
        "severity": args.severity,
    }
    forwarded = [
        "--event-type", "agent_stopped",
        "--category", args.category,
        "--out-dir", args.out_dir,
        "--out-file", args.out_file,
        "--extra", json.dumps(extra),
        "--message", args.message,
    ]
    if args.subcategory:
        forwarded += ["--subcategory", args.subcategory]
    for k, v in (
        ("--project", args.project),
        ("--session-id", args.session_id),
        ("--run-id", args.run_id),
        ("--task-id", args.task_id),
        ("--module", args.module),
        ("--phase", args.phase),
        ("--agent", args.agent),
        ("--model", args.model),
        ("--failed-verifier", args.failed_verifier),
        ("--verifier-state", args.verifier_state),
        ("--lesson-candidate", args.lesson_candidate),
    ):
        if v:
            forwarded += [k, v]
    if args.confidence is not None:
        forwarded += ["--confidence", str(args.confidence)]
    if args.print:
        forwarded.append("--print")
    return log_event.main_cli(forwarded)


if __name__ == "__main__":
    sys.exit(main())
