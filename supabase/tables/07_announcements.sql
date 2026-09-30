-- 07_announcements.sql — SERVICE DOMAIN, part 4 (offers & greetings).
-- Needs: 01_staff.sql. Safe to re-run.

do $$
begin
  if to_regclass('public.staff') is null then
    raise exception 'Missing table public.staff — run 01_staff.sql first (order: 00 → 01 … → 07 …)';
  end if;
end $$;

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
