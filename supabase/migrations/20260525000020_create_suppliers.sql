-- TASK-013..017 — create `suppliers`.

create table if not exists public.suppliers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  contact_email text,
  contact_phone text,
  address       text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index if not exists suppliers_name_idx on public.suppliers (name);
create index if not exists suppliers_not_deleted_idx
  on public.suppliers (id) where deleted_at is null;

alter table public.suppliers enable row level security;
create policy suppliers_anon_select on public.suppliers for select to anon using (true);
create policy suppliers_anon_insert on public.suppliers for insert to anon with check (true);
create policy suppliers_anon_update on public.suppliers for update to anon using (true) with check (true);
