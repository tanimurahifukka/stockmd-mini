-- TASK-003 — create `stocks` table.
-- stocks is the SKU-level definition of an inventory item type. Per-lot
-- quantities/expiry live in the future `lots` resource.
-- Soft-delete via deleted_at (resources.md: deletion=soft).

create table if not exists public.stocks (
  id              uuid primary key default gen_random_uuid(),
  sku             text not null unique,
  name            text not null,
  unit            text not null default 'piece',
  default_location text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists stocks_name_idx on public.stocks (name);
create index if not exists stocks_not_deleted_idx
  on public.stocks (id) where deleted_at is null;

alter table public.stocks enable row level security;

-- Phase 1 MVP: open policies for anon. To be tightened once auth lands.
-- See QUESTIONS.md (TASK-003) — schema and policies are pending human review.
create policy stocks_anon_select
  on public.stocks for select to anon
  using (deleted_at is null);

create policy stocks_anon_insert
  on public.stocks for insert to anon
  with check (true);
