# stockmd-mini

Experimental sandbox project for [agent-harness-skills][harness]. Next.js 14 +
Supabase local; the agent's "fire pit" where Phase 0/1 lessons accumulate and
flow back upstream.

[harness]: https://github.com/tanimurahifukka/agent-harness-skills

## Resources (all CRUDL)

| Resource          | Module                          | API base                        |
|-------------------|---------------------------------|---------------------------------|
| stocks            | `src/modules/stocks/`           | `/api/stocks`                   |
| lots              | `src/modules/lots/`             | `/api/lots`                     |
| suppliers         | `src/modules/suppliers/`        | `/api/suppliers`                |
| purchase_orders   | `src/modules/purchase_orders/`  | `/api/purchase-orders`          |
| nfc_tags          | `src/modules/nfc_tags/`         | `/api/nfc-tags`                 |

Each resource exposes:

```
GET    /api/<plural>?limit=&offset=&include_deleted=  list (paged; default 50)
POST   /api/<plural>                                  create  -> 201
GET    /api/<plural>/{uuid}                           read    -> 200 / 404
PATCH  /api/<plural>/{uuid}                           update  -> 200 / 404 / 400
DELETE /api/<plural>/{uuid}                           soft-delete -> 200 / 404
```

Plus `GET /api/health` for the sandbox healthcheck.

## Quick start

```bash
# Phase 0 — bring up Docker + Supabase local + Next.js app
bash scripts/sandbox/doctor.sh
bash scripts/sandbox/up.sh

# Health
curl -s http://127.0.0.1:3000/api/health

# Full CRUDL smoke across all 5 resources (~33 assertions)
bash tests/api-smoke.sh

# Deterministic verifier (strict by default — needs sandbox healthy)
bash scripts/verify.sh
# Or offline:
VERIFY_REQUIRE_SANDBOX=0 bash scripts/verify.sh
```

## Layout

```
src/
  app/api/
    health/route.ts
    stocks/route.ts                 GET (list) + POST (create)
    stocks/[id]/route.ts            GET + PATCH + DELETE
    lots/...                        same shape
    suppliers/...
    purchase-orders/...
    nfc-tags/...
  modules/<resource>/
    index.ts                        public surface — external code imports only this
    types.ts                        row + create/update inputs
    schema.ts                       runtime validation (validateCreate / validateUpdate)
    repo.ts                         Supabase queries; maps pg error codes -> kinds
    service.ts                      orchestration; returns ServiceResult<T> sum type
  lib/
    supabase/server.ts              server client; prefers SUPABASE_URL_SERVER
    query.ts                        parseListQuery, isUuid

supabase/migrations/
  20260525000001_create_stocks.sql
  20260525000002_stocks_update_delete_policies.sql
  20260525000003_stocks_select_all_rows.sql
  20260525000010_create_lots.sql
  20260525000020_create_suppliers.sql
  20260525000030_create_purchase_orders.sql
  20260525000040_create_nfc_tags.sql

scripts/
  sandbox/   doctor.sh up.sh down.sh reset.sh status.sh logs.sh healthcheck.sh migrate.sh seed.sh
  verify.sh + verify/*.sh
  evolution/ log_event.py log_stop.py log_success.py collect_recent.py append_question.py validate_event_schema.py

.agent/
  protected-files.json
  runtime/state.json heartbeat.json sandbox-state.json kill-switch.example
  events/*.jsonl    (gitignored — per-session)
  lessons/{recent-lessons.md, project-lessons.md, lesson-candidates.jsonl}
  schemas/{event,stop-event,success-event,sandbox-event}.schema.json + stop-categories.yaml
```

## Conventions

- **Soft delete** via `deleted_at = now()`. `DELETE` endpoint does this; list
  excludes deleted rows unless `?include_deleted=true`.
- **Module boundaries**: under `src/modules/<A>/` you can only import from
  `src/modules/<B>/` via its `index.ts`. Enforced by
  `dependency-cruiser.config.js` and `scripts/verify/50-module-boundaries.sh`.
- **RLS**: every table enables RLS with permissive anon SELECT/INSERT/UPDATE
  policies for the Phase 1 MVP. To tighten when auth lands — see
  `QUESTIONS.md`.
- **Error shape**: `{ "error": "<kind>", "message"?: "...", "details"?: [...] }`
  with HTTP status from the table above. Foreign-key violations map to 422
  with a kind like `missing_supplier` / `missing_stock` / `missing_ref`.

## Session protocol for the agent

`CLAUDE.md` / `AGENTS.md` are loaded every turn. At session start the agent
runs `python3 scripts/evolution/collect_recent.py`, reads
`.agent/lessons/recent-lessons.md`, and confirms `bash scripts/sandbox/status.sh`
reports healthy before touching anything.

## Lessons fed back to agent-harness-skills

Each Phase 0/1 stumble is logged to `.agent/events/stop-events.jsonl` and the
generic ones get upstreamed as commits to [agent-harness-skills][harness]
(v1.1.1, v1.1.2, v1.1.3 so far). See `agent-progress.md` for the running log.
