#!/usr/bin/env python3
"""Generate .agent/lessons/recent-lessons.md from .agent/events/*.jsonl.

Pure stdlib. Read-only on events.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def _load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out: list[dict] = []
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                # Tolerate corrupted lines so a bad write does not block all readers.
                continue
    return out


def _fmt_ts(ts: str) -> str:
    if not ts:
        return "-"
    return ts.replace("T", " ")[:19]


def _truncate(s: str, n: int = 80) -> str:
    if not s:
        return ""
    if len(s) <= n:
        return s
    return s[: n - 1] + "…"


def _recent(events: list[dict], limit: int) -> list[dict]:
    return sorted(events, key=lambda e: e.get("ts", ""), reverse=True)[:limit]


def _recurring_patterns(stops: list[dict], min_count: int) -> list[tuple[str, str, int, str]]:
    counter: Counter[tuple[str, str]] = Counter()
    last_seen: dict[tuple[str, str], str] = {}
    for e in stops:
        key = (e.get("stop_category") or e.get("category") or "?", e.get("stop_subcategory") or "?")
        counter[key] += 1
        ts = e.get("ts") or ""
        if ts > last_seen.get(key, ""):
            last_seen[key] = ts
    items = []
    for (cat, sub), count in counter.most_common():
        if count >= min_count:
            items.append((cat, sub, count, last_seen.get((cat, sub), "-")))
    return items


def _open_questions(questions_path: Path) -> list[str]:
    if not questions_path.exists():
        return []
    text = questions_path.read_text(encoding="utf-8")
    in_open = False
    open_lines: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("## Open"):
            in_open = True
            continue
        if s.startswith("## "):
            in_open = False
            continue
        if in_open and s.startswith("- ["):
            open_lines.append(line.rstrip())
    return open_lines


def render(
    *,
    project: str,
    stops: list[dict],
    successes: list[dict],
    open_questions: list[str],
    limit: int,
    min_pattern: int,
) -> str:
    now = _dt.datetime.now().astimezone().isoformat(timespec="seconds")
    patterns = _recurring_patterns(stops, min_pattern)

    lines: list[str] = []
    lines.append(f"# Recent Lessons — {project}")
    lines.append("")
    lines.append(f"Generated: {now}")
    lines.append(f"Project: {project}")
    lines.append("")

    # Session caution = top recurring pattern, if any
    lines.append("## Session caution")
    lines.append("")
    if patterns:
        cat, sub, count, _ = patterns[0]
        lines.append(
            f"Recent sessions have repeatedly stopped with **{cat}/{sub}** "
            f"({count} times). Before starting a new task, check whether the "
            "root cause is still in the spec or the code."
        )
    else:
        lines.append("No recurring patterns yet. Proceed normally.")
    lines.append("")

    # Recurring patterns
    lines.append("## Recurring patterns")
    lines.append("")
    if patterns:
        for idx, (cat, sub, count, last) in enumerate(patterns, 1):
            lines.append(f"### {idx}. {cat} / {sub}")
            lines.append("")
            lines.append(f"- Occurrences: {count}")
            lines.append(f"- Last seen: {_fmt_ts(last)}")
            lines.append("- Suggested action:")
            lines.append(f"  - Inspect existing tasks tagged `{sub}` before starting work.")
            lines.append("  - If the spec is silent, add a question to `QUESTIONS.md` first.")
            lines.append("")
    else:
        lines.append("(none — patterns appear after the same category fires 3+ times.)")
        lines.append("")

    # Recent stop events
    lines.append("## Recent stop events")
    lines.append("")
    lines.append("| Time | Task | Category | Lesson |")
    lines.append("|------|------|----------|--------|")
    for e in _recent(stops, limit):
        cat = e.get("stop_category") or e.get("category") or "?"
        sub = e.get("stop_subcategory") or "?"
        msg = _truncate(e.get("message") or e.get("lesson", {}).get("lesson_candidate") or "")
        lines.append(
            f"| {_fmt_ts(e.get('ts', ''))} | {e.get('task_id') or '-'} | {cat}/{sub} | {msg} |"
        )
    lines.append("")

    # Recent success patterns
    lines.append("## Recent success patterns")
    lines.append("")
    lines.append("| Time | Task | Pattern |")
    lines.append("|------|------|---------|")
    for e in _recent(successes, limit):
        sp = e.get("success_pattern", {}) or {}
        pattern = sp.get("what_worked") or sp.get("reusable_hint") or e.get("message") or ""
        lines.append(
            f"| {_fmt_ts(e.get('ts', ''))} | {e.get('task_id') or '-'} | {_truncate(pattern)} |"
        )
    lines.append("")

    # Open questions
    lines.append("## Open questions")
    lines.append("")
    if open_questions:
        for q in open_questions[:limit]:
            lines.append(q)
    else:
        lines.append("(none — see `QUESTIONS.md`.)")
    lines.append("")

    return "\n".join(lines)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--project", default=os.path.basename(os.getcwd()))
    p.add_argument("--events-dir", default=".agent/events")
    p.add_argument("--questions", default="QUESTIONS.md")
    p.add_argument("--out", default=".agent/lessons/recent-lessons.md")
    p.add_argument("--limit", type=int, default=10)
    p.add_argument("--min-pattern", type=int, default=3)
    args = p.parse_args()

    events_dir = Path(args.events_dir)
    stops = _load_jsonl(events_dir / "stop-events.jsonl")
    successes = _load_jsonl(events_dir / "success-events.jsonl")
    questions = _open_questions(Path(args.questions))

    body = render(
        project=args.project,
        stops=stops,
        successes=successes,
        open_questions=questions,
        limit=args.limit,
        min_pattern=args.min_pattern,
    )

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(body, encoding="utf-8")
    print(f"wrote {out_path} ({len(stops)} stops, {len(successes)} successes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
