-- 01_staff.sql — STAFF DOMAIN (who runs the service desk).
-- No dependencies. Safe to re-run.

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
