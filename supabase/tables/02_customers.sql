-- 02_customers.sql — CUSTOMER DOMAIN, part 1 (who owns the vehicles).
-- No dependencies. Safe to re-run.

create table if not exists public.customers (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  customer_id   text        unique,            -- login id, e.g. CUST001
  phone         text        not null,          -- login id
  email         text,                          -- login id (nullable: walk-ins)
  password_hash text,                          -- bcrypt, null until password set
  company_name  text,                          -- optional (resorts, clubs)
  gst_number    text,                          -- optional
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.customers is 'Vehicle owners. Login accepts customer_id, email or phone.';

-- Company columns for DBs created by the older script (no-op if present).
alter table public.customers add column if not exists company_name text;
alter table public.customers add column if not exists gst_number text;

-- Fast login lookups on non-unique columns.
create index if not exists idx_customers_email on public.customers (email);
create index if not exists idx_customers_phone on public.customers (phone);

drop trigger if exists trg_customers_updated on public.customers;
create trigger trg_customers_updated
  before update on public.customers
  for each row execute function public.set_updated_at();
