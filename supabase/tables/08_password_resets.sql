-- 08_password_resets.sql — AUTH DOMAIN (Gmail OTPs for password recovery).
-- Needs: 01_staff.sql, 02_customers.sql. Safe to re-run.

do $$
begin
  if to_regclass('public.staff') is null then
    raise exception 'Missing table public.staff — run 01_staff.sql first (order: 00 → 01 → 02 … → 08 …)';
  end if;
  if to_regclass('public.customers') is null then
    raise exception 'Missing table public.customers — run 02_customers.sql first (order: 00 → 01 → 02 … → 08 …)';
  end if;
end $$;

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

create index if not exists idx_password_resets_customer
  on public.password_resets (customer_id, used, expires_at);
create index if not exists idx_password_resets_staff
  on public.password_resets (staff_id, used, expires_at);

-- Signup OTPs (email verification for brand-new customers; no account yet).
-- Lives in this file: same AUTH DOMAIN, same run position (needs nothing).
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
