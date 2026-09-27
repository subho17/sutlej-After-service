-- Sutlej After-Service Portal — Supabase (Postgres) schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run.
-- Matches the current Mongoose models (Staff, Customer, Complaint).

-- Staff (service-desk users)
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  staff_id text not null unique,
  username text not null unique,
  email text not null unique,
  phone text not null unique,
  password_hash text not null,
  role text not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  customer_id text unique,
  phone text not null,
  email text,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Complaints / service requests
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  status text not null default 'open'
    check (status in ('open', 'in-progress', 'resolved')),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_staff_updated on public.staff;
create trigger trg_staff_updated
  before update on public.staff
  for each row execute function public.set_updated_at();

drop trigger if exists trg_customers_updated on public.customers;
create trigger trg_customers_updated
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists trg_complaints_updated on public.complaints;
create trigger trg_complaints_updated
  before update on public.complaints
  for each row execute function public.set_updated_at();

-- Password-reset OTPs (one row per request; OTPs stored bcrypt-hashed)
create table if not exists public.password_resets (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('customer', 'staff')),
  customer_id uuid references public.customers(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  check (
    (role = 'customer' and customer_id is not null and staff_id is null) or
    (role = 'staff' and staff_id is not null and customer_id is null)
  )
);

create index if not exists idx_password_resets_customer
  on public.password_resets (customer_id, used, expires_at);
create index if not exists idx_password_resets_staff
  on public.password_resets (staff_id, used, expires_at);

-- Demo seed (bcrypt-hashed passwords for Staff@123 / Customer@123).
-- Demo only — replace with real accounts before production use.
insert into public.staff (name, staff_id, username, email, phone, password_hash, role)
values ('Demo Staff', 'STAFF001', 'demo.staff', 'staff@sutlej.com', '9876543210', '$2b$10$2.sculXKx8T5H/LcN2Uutunp22vAR/WSXgFhIOWtdimRAdF1WsCUu', 'staff')
on conflict (staff_id) do update set
  name = excluded.name,
  username = excluded.username,
  email = excluded.email,
  phone = excluded.phone,
  password_hash = excluded.password_hash;

insert into public.customers (name, customer_id, email, phone, password_hash)
values ('Demo Customer', 'CUST001', 'customer@sutlej.com', '9876501234', '$2b$10$2HSer./H2RE4DR04vDvjf.WvrqutnjLTMuDrRv420SDV.SIz/05Ry')
on conflict (customer_id) do update set
  name = excluded.name,
  email = excluded.email,
  phone = excluded.phone,
  password_hash = excluded.password_hash;
