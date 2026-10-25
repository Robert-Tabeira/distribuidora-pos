begin;

alter table public.products
  add column if not exists units_per_box integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_units_per_box_positive'
  ) then
    alter table public.products
      add constraint products_units_per_box_positive
      check (units_per_box is null or units_per_box > 0);
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;
