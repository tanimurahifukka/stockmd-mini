#!/usr/bin/env python3
"""Append a question to QUESTIONS.md under the Open section.

Idempotent: if a question with the same text exists in Open, do nothing.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path


HEADERS = ("## Open", "## Closed")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--task-id", default="-")
    p.add_argument("--question", required=True)
    p.add_argument("--context", default="")
    p.add_argument("--blocking", default="no", help="task id this blocks, or 'no'")
    p.add_argument("--linked-event", default="-")
    p.add_argument("--questions-file", default="QUESTIONS.md")
    args = p.parse_args()

    path = Path(args.questions_file)
    if not path.exists():
        print(f"error: {path} does not exist", file=sys.stderr)
        return 1

    text = path.read_text(encoding="utf-8")

    new_block = (
        f"- [ ] [{args.task_id}] {args.question}\n"
        f"  Context: {args.context or '-'}\n"
        f"  Blocking: {args.blocking}\n"
        f"  Linked event: {args.linked_event}\n"
    )

    if args.question.strip() in text:
        print(f"question already present in {path}")
        return 0

    lines = text.splitlines(keepends=True)
    out: list[str] = []
    inserted = False
    in_open = False
    for line in lines:
        if line.strip() == "## Open":
            in_open = True
            out.append(line)
            continue
        if in_open and line.strip().startswith("## "):
            # End of Open section — insert before this header
            if not inserted:
                out.append(new_block)
                inserted = True
            in_open = False
        out.append(line)

    if not inserted:
        if out and not out[-1].endswith("\n"):
            out.append("\n")
        out.append(new_block)

    path.write_text("".join(out), encoding="utf-8")
    print(f"appended question to {path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
