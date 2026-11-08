-- Cantidad opcional de unidades por funda, independiente de la caja.
begin;

alter table public.products add column if not exists units_per_bag integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_units_per_bag_positive'
  ) then
    alter table public.products add constraint products_units_per_bag_positive
      check (units_per_bag is null or units_per_bag > 0);
  end if;
end;
$$;

grant select (units_per_bag) on table public.products to anon, authenticated;
notify pgrst, 'reload schema';
commit;
