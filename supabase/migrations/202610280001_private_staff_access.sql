-- Restrict employee credentials and mutations to the application's server.
begin;

revoke all on table public.employees from public, anon, authenticated;
do $$
declare column_name text;
begin
  for column_name in
    select attname from pg_attribute
    where attrelid = 'public.employees'::regclass and attnum > 0 and not attisdropped
  loop
    execute format('revoke select (%1$I), insert (%1$I), update (%1$I), references (%1$I) on table public.employees from public, anon, authenticated', column_name);
  end loop;
end;
$$;

-- The existing employee picker only needs these profile fields, never the PIN hash.
grant select (id, name, role, created_at) on public.employees to anon, authenticated;
grant select, insert, update, delete on public.employees to service_role;
alter table public.employees enable row level security;
drop policy if exists staff_public_profile_read on public.employees;
create policy staff_public_profile_read on public.employees for select to anon, authenticated using (true);

do $$
declare target record;
begin
  for target in
    select p.oid::regprocedure as signature
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('verify_pin_secure', 'verify_pin', 'hash_pin')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', target.signature);
    execute format('grant execute on function %s to service_role', target.signature);
  end loop;
end;
$$;

create or replace function public.staff_keep_last_admin()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if old.role = 'admin' then
    if tg_op = 'UPDATE' and new.role = 'admin' then return new; end if;
    perform pg_advisory_xact_lock(871026280001::bigint);
    if not exists (select 1 from public.employees where role = 'admin' and id <> old.id) then
      raise exception 'staff_last_admin';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.staff_keep_last_admin() from public, anon, authenticated;
drop trigger if exists staff_keep_last_admin on public.employees;
create trigger staff_keep_last_admin before delete or update of role on public.employees
for each row execute function public.staff_keep_last_admin();

notify pgrst, 'reload schema';
commit;
