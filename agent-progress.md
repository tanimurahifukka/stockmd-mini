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

- 2026-05-25 — TASK-003 (success): `create` for `stocks`.

  Resource shape decision (logged as project lesson + QUESTIONS.md entry):
  minimal SKU-level table — `id uuid pk, sku text unique, name text,
  unit text default 'piece', default_location text, notes text,
  created_at, updated_at, deleted_at` (soft delete). RLS on, open
  policies for anon as Phase 1 MVP (to tighten when auth lands).

  Migration: `supabase/migrations/20260525000001_create_stocks.sql`.
  Module:    `src/modules/stocks/{types,schema,repo,service,index}.ts`
             via `src/lib/supabase/server.ts`.
  Route:     `POST /api/stocks` → 201 / 400 / 409 / 500.

  Verified end-to-end: 201 happy, 409 duplicate sku, 400 validation,
  400 invalid_json. `pnpm typecheck` clean inside container.
  `verify.sh` passes in strict mode (`VERIFY_REQUIRE_SANDBOX=1`).

  One new Phase 1 quirk surfaced and patched in-repo (event logged):
  - `connection_failure`: server-side Supabase client used 127.0.0.1
    inside the container; needed `SUPABASE_URL_SERVER=http://host.docker.internal:54321`.
    Lesson upstreamable to `agent-harness-stack-nextjs`.

- 2026-05-25 — TASK-004..007 (success): `stocks` list/read/update/delete.

  Added `validateUpdate`, repo `listStocks/getStock/updateStock/softDeleteStock`,
  GET on `/api/stocks`, full `[id]/route.ts` with GET/PATCH/DELETE.

  Two RLS lessons logged (both upstreamable):
  1. `missing_auth_policy` — INSERT/SELECT-only policies meant PATCH and
     DELETE silently returned 0 rows → 404. Added UPDATE policy.
  2. `inconsistent_docs` — SELECT policy `using (deleted_at is null)`
     blocked the RETURNING clause of soft-delete UPDATE → "new row violates
     RLS". Made SELECT open; filtering is the service's job.

  Migrations: `20260525000002_stocks_update_delete_policies.sql`,
              `20260525000003_stocks_select_all_rows.sql`.

- 2026-05-25 — TASK-008..012 (success): `lots` full CRUDL.

  Migration `20260525000010_create_lots.sql` ships table + UNIQUE(stock_id, lot_code)
  + 3 indexes + RLS with all four policies in one go (lesson from TASK-006 applied).
  FK → stocks(id) ON DELETE RESTRICT. Postgres 23503 mapped to 422 `missing_stock`.

- 2026-05-25 — TASK-013..017 (success): `suppliers` full CRUDL.

  Pattern is stable: types/schema/repo/service/index + route + [id]/route.ts.
  Slug uniqueness with `^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$` regex.
  Email validation via a permissive `@.` shape check.

- 2026-05-25 — TASK-018..022 (success): `purchase_orders` full CRUDL.

  Status as `text` + `CHECK (status in (...))` for db enforcement plus a
  TypeScript literal type for compile-time enforcement. Two layers of defense.
  FK → suppliers(id) ON DELETE RESTRICT; currency normalized to upper-case.

- 2026-05-25 — TASK-023..027 (success): `nfc_tags` full CRUDL.

  Optional bind to lot OR stock (mutex enforced by Postgres CHECK + service
  validation). UID normalized at validation time (strip `:`, `-`, whitespace;
  upper-case) so duplicate detection works regardless of input format.

- 2026-05-25 — Final consolidation: `tests/api-smoke.sh` added (33 assertions
  across all 5 resources). `verify.sh` green in strict mode. README written.
  27/27 task_queue.json tasks marked completed. Five Phase-0/1 lessons
  upstreamed to agent-harness-skills (v1.1.1, v1.1.2, v1.1.3).
