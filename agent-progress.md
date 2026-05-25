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

- 2026-05-25 — TASK-002 (success): first Phase 0 brought sandbox up and
  passed the verifier in strict mode (`VERIFY_REQUIRE_SANDBOX=1`).

  Four environment quirks were surfaced and patched along the way (events
  logged to `.agent/events/stop-events.jsonl`; see
  `.agent/lessons/recent-lessons.md`):

  1. `docker_daemon_down` — host uses OrbStack, not Docker Desktop; `doctor.sh`
     suggested `open -a Docker` which doesn't exist. Resolved with `orb start`.
  2. `port_conflict` — another local Supabase project (`itamin`) held
     54321/54322/54323/54324. Resolved with `supabase stop` in that project.
  3. `verifier_integrity_failure` — `scripts/sandbox/healthcheck.sh` non-wait
     branch returned exit 0 even when `check_once` returned 60, because
     `if check_once; then ... fi` resets `$?` to 0 after the conditional.
     Fixed: capture return code before the conditional.
  4. `app_health_failed` — `docker-compose.yml` healthcheck used `wget`,
     which is absent from `node:20-bookworm-slim`. Fixed: use Node's
     built-in `fetch` for the compose healthcheck command.

  Lessons 3 and 4 were upstreamed to `agent-harness-skills`.
