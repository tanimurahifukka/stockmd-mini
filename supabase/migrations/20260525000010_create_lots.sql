-- TASK-008..012 — create `lots` (per-batch receipt of a stocks item).
-- See resources.md row and QUESTIONS.md for schema rationale.

create table if not exists public.lots (
  id           uuid primary key default gen_random_uuid(),
  stock_id     uuid not null references public.stocks(id) on delete restrict,
  lot_code     text not null,
  quantity     numeric(12,2) not null default 0,
  expiry_at    date,
  location     text,
  received_at  timestamptz not null default now(),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (stock_id, lot_code)
);

create index if not exists lots_stock_id_idx on public.lots (stock_id);
create index if not exists lots_not_deleted_idx
  on public.lots (id) where deleted_at is null;
create index if not exists lots_expiry_idx on public.lots (expiry_at);

alter table public.lots enable row level security;

-- Phase 1 MVP: open policies for anon (all four verbs we exercise + SELECT).
create policy lots_anon_select on public.lots for select to anon using (true);
create policy lots_anon_insert on public.lots for insert to anon with check (true);
create policy lots_anon_update on public.lots for update to anon using (true) with check (true);
