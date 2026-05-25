# Agent Progress — stockmd-mini

Running ledger of agent sessions. Append, do not delete. One entry per task or
significant pause.

## Session protocol

At session start:

1. Read this file and `.agent/lessons/recent-lessons.md`.
2. Run `bash scripts/sandbox/status.sh --json` and act on it.
3. Pull the next pending task from `task_queue.json`.

At task end (success):

```
- TASK-XXX  <title>  (success)
  Commit:   <sha>
  Verifier: passed
  What worked: <one line>
```

At task end (stop):

```
- TASK-XXX  <title>  (stopped: <category>/<subcategory>)
  Reason:   <one line>
  Linked event: <event_id>
```

## Log

(empty — first agent session will append below)
