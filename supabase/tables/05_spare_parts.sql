-- 05_spare_parts.sql — SERVICE DOMAIN, part 2 (the catalog).
-- No dependencies. Safe to re-run.

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
