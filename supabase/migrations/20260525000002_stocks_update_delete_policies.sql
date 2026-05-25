-- TASK-006 / TASK-007 — add UPDATE policy for stocks.
-- Without this, anon-key updates return 0 rows (silent RLS rejection),
-- which the service maps to 404. Soft delete is performed via UPDATE
-- (setting deleted_at), so we do not need a separate DELETE policy.
--
-- Phase 1 MVP: open to anon. Tighten when auth lands (see QUESTIONS.md).

create policy stocks_anon_update
  on public.stocks for update to anon
  using (true)
  with check (true);
