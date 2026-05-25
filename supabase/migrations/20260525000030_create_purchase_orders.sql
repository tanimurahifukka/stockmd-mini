-- TASK-018..022 — create `purchase_orders` (header-level only; line items deferred).

create table if not exists public.purchase_orders (
  id              uuid primary key default gen_random_uuid(),
  po_number       text not null unique,
  supplier_id     uuid not null references public.suppliers(id) on delete restrict,
  status          text not null default 'draft'
                  check (status in ('draft','submitted','received','cancelled')),
  ordered_at      timestamptz,
  expected_at     date,
  total_amount    numeric(14,2) not null default 0,
  currency        text not null default 'JPY' check (char_length(currency) = 3),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists purchase_orders_supplier_idx on public.purchase_orders (supplier_id);
create index if not exists purchase_orders_status_idx   on public.purchase_orders (status);
create index if not exists purchase_orders_not_deleted_idx
  on public.purchase_orders (id) where deleted_at is null;

alter table public.purchase_orders enable row level security;
create policy po_anon_select on public.purchase_orders for select to anon using (true);
create policy po_anon_insert on public.purchase_orders for insert to anon with check (true);
create policy po_anon_update on public.purchase_orders for update to anon using (true) with check (true);
