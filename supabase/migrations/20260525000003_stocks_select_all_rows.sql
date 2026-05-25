-- TASK-007 — relax stocks SELECT policy so soft-delete returns the row.
-- Background: the previous policy `using (deleted_at is null)` makes the
-- post-UPDATE RETURNING clause fail with "new row violates RLS" whenever
-- the update sets deleted_at. Filtering deleted rows is the service layer's
-- job (listStocks already does `is("deleted_at", null)` unless include_deleted).
--
-- Phase 1 MVP: anon may SELECT any row. Tighten when auth lands.

drop policy if exists stocks_anon_select on public.stocks;

create policy stocks_anon_select
  on public.stocks for select to anon
  using (true);
