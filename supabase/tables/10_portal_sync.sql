-- 10_portal_sync.sql — CROSS-DEVICE SYNC for portal complaints + spare orders.
-- Needs: 04_complaints.sql, 06_spare_orders.sql. Safe to re-run.
--
-- Background: the portals kept complaints/orders in browser localStorage,
-- so a staff member on another device saw nothing. These free-text columns
-- let the backend store the same portal payload (keyed by the app-generated
-- ticket_no / order_no), and the frontend merges both sources.
-- Run this in Supabase Dashboard → SQL Editor, then redeploy the backend.

-- ---- complaints: portal payload columns -------------------------------
alter table public.complaints add column if not exists customer_name text;
alter table public.complaints add column if not exists phone text;
alter table public.complaints add column if not exists email text;
alter table public.complaints add column if not exists vehicle_reg_no text;
alter table public.complaints add column if not exists vehicle_model text;
alter table public.complaints add column if not exists source text;
alter table public.complaints add column if not exists owner_id text;

-- Portal priorities arrive as Low / Medium / High / Critical.
alter table public.complaints drop constraint if exists complaints_priority_check;
alter table public.complaints add constraint complaints_priority_check
  check (priority in ('Low', 'Medium', 'High', 'Critical'));

-- ticket_no / order_no are the upsert keys for portal writes
-- (ON CONFLICT ticket_no / order_no). Postgres rejects that clause unless the
-- column is backed by a unique index, and the `add column` upgrade path in
-- 04_complaints.sql adds ticket_no as plain text. When the CREATE TABLE
-- already declared it `unique`, its backing index has this exact name and
-- these statements are no-ops. Safe to re-run.
create unique index if not exists complaints_ticket_no_key on public.complaints (ticket_no);
create unique index if not exists spare_orders_order_no_key on public.spare_orders (order_no);

create index if not exists idx_complaints_ticket_no on public.complaints (ticket_no);
create index if not exists idx_complaints_owner on public.complaints (owner_id);

-- ---- spare_orders: portal payload columns ------------------------------
alter table public.spare_orders add column if not exists customer_name text;
alter table public.spare_orders add column if not exists phone text;
alter table public.spare_orders add column if not exists email text;
alter table public.spare_orders add column if not exists vehicle_reg_no text;
alter table public.spare_orders add column if not exists vehicle_model text;
alter table public.spare_orders add column if not exists delivery_address text;
alter table public.spare_orders add column if not exists notes text;
alter table public.spare_orders add column if not exists owner_id text;

create index if not exists idx_spare_orders_order_no on public.spare_orders (order_no);
create index if not exists idx_spare_orders_owner on public.spare_orders (owner_id);
