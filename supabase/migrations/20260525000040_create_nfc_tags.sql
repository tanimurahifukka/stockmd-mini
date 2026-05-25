-- TASK-023..027 — create `nfc_tags`. Optional bind to a lot OR a stock.

create table if not exists public.nfc_tags (
  id          uuid primary key default gen_random_uuid(),
  uid         text not null unique,
  label       text,
  lot_id      uuid references public.lots(id)   on delete set null,
  stock_id    uuid references public.stocks(id) on delete set null,
  bound_at    timestamptz,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  -- bind to at most one of lot/stock; both null = unbound is allowed.
  constraint nfc_tags_single_bind
    check (lot_id is null or stock_id is null)
);

create index if not exists nfc_tags_lot_idx   on public.nfc_tags (lot_id);
create index if not exists nfc_tags_stock_idx on public.nfc_tags (stock_id);
create index if not exists nfc_tags_not_deleted_idx
  on public.nfc_tags (id) where deleted_at is null;

alter table public.nfc_tags enable row level security;
create policy nfc_tags_anon_select on public.nfc_tags for select to anon using (true);
create policy nfc_tags_anon_insert on public.nfc_tags for insert to anon with check (true);
create policy nfc_tags_anon_update on public.nfc_tags for update to anon using (true) with check (true);
