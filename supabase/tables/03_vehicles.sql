-- 03_vehicles.sql — CUSTOMER DOMAIN, part 2 (one row per vehicle).
-- Needs: 02_customers.sql. Safe to re-run.

do $$
begin
  if to_regclass('public.customers') is null then
    raise exception 'Missing table public.customers — run 02_customers.sql first (order: 00 → 01 → 02 → 03 …)';
  end if;
end $$;

create table if not exists public.vehicles (
  id              uuid        primary key default gen_random_uuid(),
  customer_id     uuid        not null references public.customers(id) on delete cascade,
  reg_no          text        not null unique,  -- e.g. PB-10-GC-0451
  model           text        not null,         -- e.g. Club Car Tempo
  last_service_at timestamptz,
  next_service_at timestamptz,                  -- quarterly service due date
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.vehicles is 'One row per customer vehicle. next_service_at drives service reminders.';

create index if not exists idx_vehicles_customer on public.vehicles (customer_id);
create index if not exists idx_vehicles_next_service on public.vehicles (next_service_at);

drop trigger if exists trg_vehicles_updated on public.vehicles;
create trigger trg_vehicles_updated
  before update on public.vehicles
  for each row execute function public.set_updated_at();
