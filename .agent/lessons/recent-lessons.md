# Recent Lessons — stockmd-mini

Generated: 2026-05-25T12:12:50+09:00
Project: stockmd-mini

## Session caution

No recurring patterns yet. Proceed normally.

## Recurring patterns

(none — patterns appear after the same category fires 3+ times.)

## Recent stop events

| Time | Task | Category | Lesson |
|------|------|----------|--------|
| 2026-05-25 12:12:50 | TASK-027 | verifier/test_failure | api-smoke's nfc UID generator only used the last 2 chars of $ts, so re-runs in … |
| 2026-05-25 11:18:15 | TASK-006 | specification/missing_auth_policy | RLS UPDATE/DELETE policies were missing; PATCH and DELETE silently returned 0 r… |
| 2026-05-25 11:18:15 | TASK-007 | specification/inconsistent_docs | Soft-delete via UPDATE deleted_at=now() conflicted with a SELECT policy that hi… |
| 2026-05-25 11:06:01 | TASK-003 | specification/spec_ambiguity | resources.md only declared meta (deletion, ownership, pii) for stocks; field sc… |
| 2026-05-25 11:06:01 | TASK-003 | environment/connection_failure | Server-side Supabase client used [REDACTED] (127.0.0.1) inside the container; 1… |
| 2026-05-25 10:53:05 | TASK-002 | verifier/verifier_integrity_failure | healthcheck.sh non-wait branch returned exit 0 even when check_once returned 60… |
| 2026-05-25 10:53:05 | TASK-002 | environment/app_health_failed | docker-compose healthcheck used wget, which is not present in node:20-bookworm-… |
| 2026-05-25 10:53:04 | TASK-002 | environment/docker_daemon_down | OrbStack daemon was not running on first up.sh attempt; doctor.sh fail (exit 10… |
| 2026-05-25 10:53:04 | TASK-002 | environment/port_conflict | Another local Supabase project (itamin) held the default ports 54321-54324. |

## Recent success patterns

| Time | Task | Pattern |
|------|------|---------|
| 2026-05-25 12:12:50 | TASK-027 | Verifier strengthened from spec-consistency to implementation-existence (route … |
| 2026-05-25 11:32:24 | TASK-027 | uid normalization (strip :,-, whitespace; uppercase) happens once in validation… |
| 2026-05-25 11:29:10 | TASK-022 | Status as text + CHECK constraint stays out of the type system but in the datab… |
| 2026-05-25 11:25:31 | TASK-017 | Pattern stabilizing — copy lots, swap field names, swap unique key (slug not lo… |
| 2026-05-25 11:22:25 | TASK-012 | Single migration shipped all four anon RLS policies (select/insert/update — sof… |
| 2026-05-25 11:18:15 | TASK-007 | Catching both RLS gaps in the route layer (404/500 from PostgREST) before they … |
| 2026-05-25 11:06:01 | TASK-003 | Wrote the migration first, then the module skeleton (types/schema/repo/service/… |
| 2026-05-25 10:53:05 | TASK-002 | Phase 0 brought up cleanly on second attempt after 4 deterministic fixes (orb s… |

## Open questions

- [ ] [TASK-003] Confirm or refine the stocks schema chosen for TASK-003 (sku, name, unit, default_location, notes; quantities live in lots). Should there be a category_id, brand, supplier_id, manufacturer_code?
- [ ] [TASK-008] Confirm or refine lots schema: stock_id FK, lot_code, quantity numeric, expiry_at date, location, received_at. Should quantity allow negative for adjustments? Should we constrain lot_code uniqueness per stock_id or globally?
