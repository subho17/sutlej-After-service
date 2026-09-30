-- 09_demo_seed.sql — DEMO LOGINS. Run LAST (needs staff + customers).
-- Replace with real accounts before production.
-- Staff: STAFF001 / Staff@123 · Customer: CUST001 / Customer@123
-- (passwords stored bcrypt-hashed).

do $$
begin
  if to_regclass('public.staff') is null then
    raise exception 'Missing table public.staff — run 01_staff.sql first, then 09 last';
  end if;
  if to_regclass('public.customers') is null then
    raise exception 'Missing table public.customers — run 02_customers.sql first, then 09 last';
  end if;
end $$;

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
