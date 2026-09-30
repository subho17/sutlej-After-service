-- 00_helpers.sql — run FIRST (everything below needs this function).
-- Creates the trigger function that keeps updated_at fresh on UPDATE.

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
