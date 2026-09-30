-- 04_complaints.sql — SERVICE DOMAIN, part 1 (service tickets).
-- Needs: 01_staff.sql, 02_customers.sql, 03_vehicles.sql. Safe to re-run.
-- Lifecycle: open → in-progress → resolved → closed.

do $$
begin
  if to_regclass('public.staff') is null then
    raise exception 'Missing table public.staff — run 01_staff.sql first (order: 00 → 01 → 02 → 03 → 04 …)';
  end if;
  if to_regclass('public.customers') is null then
    raise exception 'Missing table public.customers — run 02_customers.sql first (order: 00 → 01 → 02 → 03 → 04 …)';
  end if;
  if to_regclass('public.vehicles') is null then
    raise exception 'Missing table public.vehicles — run 03_vehicles.sql first (order: 00 → 01 → 02 → 03 → 04 …)';
  end if;
end $$;

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
                    check (status in ('open', 'in-progress', 'resolved', 'closed')),
  history           jsonb       not null default '[]',  -- audit trail of status moves
  created_by        text,                      -- free-text author (legacy)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.complaints is 'Service tickets. Lifecycle: open → in-progress → resolved → closed.';

-- Upgrade path for DBs created by the older, smaller script (no-op otherwise).
alter table public.complaints add column if not exists ticket_no text;
alter table public.complaints add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.complaints add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;
alter table public.complaints add column if not exists assigned_staff_id uuid references public.staff(id) on delete set null;
alter table public.complaints add column if not exists category text;
alter table public.complaints add column if not exists priority text not null default 'Medium';
alter table public.complaints add column if not exists history jsonb not null default '[]';

-- Widen the old status check to include 'closed'.
alter table public.complaints drop constraint if exists complaints_status_check;
alter table public.complaints add constraint complaints_status_check
  check (status in ('open', 'in-progress', 'resolved', 'closed'));

-- Complaint lookups: by customer, vehicle, assignee, status.
create index if not exists idx_complaints_customer on public.complaints (customer_id);
create index if not exists idx_complaints_vehicle on public.complaints (vehicle_id);
create index if not exists idx_complaints_assignee on public.complaints (assigned_staff_id);
create index if not exists idx_complaints_status on public.complaints (status);

drop trigger if exists trg_complaints_updated on public.complaints;
create trigger trg_complaints_updated
  before update on public.complaints
  for each row execute function public.set_updated_at();
