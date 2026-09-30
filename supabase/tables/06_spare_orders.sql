-- 06_spare_orders.sql — SERVICE DOMAIN, part 3 (customer/staff orders).
-- Needs: 02_customers.sql. Safe to re-run.
-- Lifecycle: pending → processing → dispatched → delivered (or cancelled).

do $$
begin
  if to_regclass('public.customers') is null then
    raise exception 'Missing table public.customers — run 02_customers.sql first (order: 00 → 01 → 02 … → 06 …)';
  end if;
end $$;

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
