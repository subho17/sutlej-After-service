-- =====================================================================
-- Sutlej After-Service Portal — Supabase (Postgres) schema
--
-- Run: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement is IF NOT EXISTS / idempotent.
--
-- Map (each domain is independent — read only what you need):
--   0. Helpers ............ updated_at trigger
--   1. STAFF DOMAIN ....... staff (who runs the service desk)
--   2. CUSTOMER DOMAIN .... customers, vehicles (who owns what)
--   3. SERVICE DOMAIN ..... complaints, spare_parts, spare_orders,
--                           announcements (the shared work)
--   4. AUTH DOMAIN ........ password_resets (Gmail OTPs)
--   5. DEMO SEED .......... demo logins (replace before production)
-- =====================================================================


-- =====================================================================
-- 0. HELPERS
-- =====================================================================

-- Keeps updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- =====================================================================
-- 1. STAFF DOMAIN — who runs the service desk
-- =====================================================================

create table if not exists public.staff (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null,
  staff_id      text        not null unique,   -- login id, e.g. STAFF001
  username      text        not null unique,   -- login id, e.g. demo.staff
  email         text        not null unique,   -- login id
  phone         text        not null unique,   -- login id
  password_hash text        not null,          -- bcrypt, never plain text
  role          text        not null default 'staff' check (role in ('admin', 'staff')),
  active        boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.staff is 'Service-desk users. Login accepts staff_id, username, email or phone.';

drop trigger if exists trg_staff_updated on public.staff;
create trigger trg_staff_updated
  before update on public.staff
  for each row execute function public.set_updated_at();


-- =====================================================================
-- 2. CUSTOMER DOMAIN — who owns the vehicles
-- =====================================================================

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

-- ---- 2.2 vehicles: one row per customer vehicle ---------------------

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


-- =====================================================================
-- 3. SERVICE DOMAIN — the shared work (links staff + customer)
-- =====================================================================

-- ---- 3.1 complaints: service requests / tickets ---------------------

create table if not exists public.complaints (
  id                uuid        primary key default gen_random_uuid(),
  ticket_no         text        unique,        -- e.g. CMP-2026-0001 (app-generated)
  title             text        not null,
  description       text        not null,
  customer_id       uuid        references public.customers(id) on delete set null,
  vehicle_id        uuid        references public.vehicles(id) on delete set null,
  assigned_staff_id uuid        references public.staff(id) on delete set null,
  category          text,                      -- e.g. Battery / Charging issue
  priority          text        not null default 'Medium'
                    check (priority in ('Low', 'Medium', 'High', 'Critical')),
  status            text        not null default 'open'
                    check (status in ('pending', 'open', 'in-progress', 'resolved', 'closed')),
  history           jsonb       not null default '[]',  -- audit trail of status moves
  created_by        text,                      -- free-text author (legacy)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.complaints is 'Service tickets. Lifecycle: open → in-progress → resolved → closed.';

-- Lifecycle columns for DBs created by the older script (no-op if present).
alter table public.complaints add column if not exists ticket_no text;
alter table public.complaints add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.complaints add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;
alter table public.complaints add column if not exists assigned_staff_id uuid references public.staff(id) on delete set null;
alter table public.complaints add column if not exists category text;
alter table public.complaints add column if not exists priority text not null default 'Medium';
alter table public.complaints add column if not exists history jsonb not null default '[]';

-- Widen the old status check to include 'pending' and 'closed'.
alter table public.complaints drop constraint if exists complaints_status_check;
alter table public.complaints add constraint complaints_status_check
  check (status in ('pending', 'open', 'in-progress', 'resolved', 'closed'));

-- Complaint lookups: by customer, vehicle, assignee, status.
create index if not exists idx_complaints_customer on public.complaints (customer_id);
create index if not exists idx_complaints_vehicle on public.complaints (vehicle_id);
create index if not exists idx_complaints_assignee on public.complaints (assigned_staff_id);
create index if not exists idx_complaints_status on public.complaints (status);

drop trigger if exists trg_complaints_updated on public.complaints;
create trigger trg_complaints_updated
  before update on public.complaints
  for each row execute function public.set_updated_at();

-- ---- 3.2 spare_parts: the catalog -----------------------------------

create table if not exists public.spare_parts (
  id         uuid          primary key default gen_random_uuid(),
  sku        text          not null unique,   -- e.g. SP-001
  name       text          not null,
  category   text          not null,
  price      numeric(10,2) not null default 0 check (price >= 0),
  stock      integer       not null default 0 check (stock >= 0),
  created_at timestamptz   not null default now(),
  updated_at timestamptz   not null default now()
);

comment on table public.spare_parts is 'Spare-parts catalog. Stock is decremented atomically on order.';

create index if not exists idx_spare_parts_category on public.spare_parts (category);

drop trigger if exists trg_spare_parts_updated on public.spare_parts;
create trigger trg_spare_parts_updated
  before update on public.spare_parts
  for each row execute function public.set_updated_at();

-- ---- 3.3 spare_orders: customer/staff orders -------------------------

create table if not exists public.spare_orders (
  id          uuid          primary key default gen_random_uuid(),
  order_no    text          unique,        -- e.g. ORD-2026-0001 (app-generated)
  customer_id uuid          references public.customers(id) on delete set null,
  items       jsonb         not null default '[]',
  -- items: [{ partId, partName, partNumber, quantity, unitPrice }]
  total       numeric(10,2) not null default 0 check (total >= 0),
  status      text          not null default 'pending'
              check (status in ('pending', 'processing', 'dispatched', 'delivered', 'cancelled')),
  created_by  text          not null default 'customer' check (created_by in ('customer', 'staff')),
  created_at  timestamptz   not null default now(),
  updated_at  timestamptz   not null default now()
);

comment on table public.spare_orders is 'Spare-part orders. Lifecycle: pending → processing → dispatched → delivered (or cancelled).';

create index if not exists idx_spare_orders_customer on public.spare_orders (customer_id);
create index if not exists idx_spare_orders_status on public.spare_orders (status);

drop trigger if exists trg_spare_orders_updated on public.spare_orders;
create trigger trg_spare_orders_updated
  before update on public.spare_orders
  for each row execute function public.set_updated_at();

-- ---- 3.4 announcements: offers & greetings ---------------------------

create table if not exists public.announcements (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  message      text        not null,
  active       boolean     not null default true,
  published_by uuid        references public.staff(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.announcements is 'Offers/greetings. Only active=true rows show on the customer portal.';

-- Partial index: the customer home query only ever reads active rows.
create index if not exists idx_announcements_active
  on public.announcements (created_at desc) where active;

drop trigger if exists trg_announcements_updated on public.announcements;
create trigger trg_announcements_updated
  before update on public.announcements
  for each row execute function public.set_updated_at();


-- =====================================================================
-- 4. AUTH DOMAIN — Gmail OTPs for password recovery
-- =====================================================================

create table if not exists public.password_resets (
  id          uuid        primary key default gen_random_uuid(),
  role        text        not null check (role in ('customer', 'staff')),
  customer_id uuid        references public.customers(id) on delete cascade,
  staff_id    uuid        references public.staff(id) on delete cascade,
  email       text        not null,   -- where the OTP was sent
  otp_hash    text        not null,   -- bcrypt, never plain text
  expires_at  timestamptz not null,
  used        boolean     not null default false,
  attempts    integer     not null default 0,
  created_at  timestamptz not null default now(),
  check (
    (role = 'customer' and customer_id is not null and staff_id is null) or
    (role = 'staff' and staff_id is not null and customer_id is null)
  )
);

comment on table public.password_resets is 'One row per OTP request. Staff OTPs go to the fixed admin inbox.';

-- Signup OTPs (email verification for brand-new customers; no account yet).
create table if not exists public.signup_requests (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  phone        text        not null,
  email        text        not null,
  otp_hash     text        not null,   -- bcrypt, never plain text
  expires_at   timestamptz not null,
  used         boolean     not null default false,
  attempts     integer     not null default 0,
  created_at   timestamptz not null default now()
);

comment on table public.signup_requests is 'Pending customer signups awaiting email OTP verification.';

create index if not exists idx_signup_requests_email
  on public.signup_requests (email, used, expires_at);

create index if not exists idx_password_resets_customer
  on public.password_resets (customer_id, used, expires_at);
create index if not exists idx_password_resets_staff
  on public.password_resets (staff_id, used, expires_at);


-- =====================================================================
-- 5. DEMO SEED — replace with real accounts before production
-- Staff: STAFF001 / Staff@123 · Customer: CUST001 / Customer@123
-- =====================================================================

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

-- One demo vehicle so the customer home has something to show.
insert into public.vehicles (customer_id, reg_no, model, last_service_at, next_service_at)
select id, 'PB-10-GC-0451', 'Club Car Tempo',
  now() - interval '80 days', now() + interval '10 days'
from public.customers where customer_id = 'CUST001'
on conflict (reg_no) do nothing;
