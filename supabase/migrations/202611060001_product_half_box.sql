-- La venta por media caja se habilita individualmente y comienza desactivada.
begin;

alter table public.products
  add column if not exists allow_half_box boolean not null default false;

grant select (allow_half_box) on table public.products to anon, authenticated;

notify pgrst, 'reload schema';
commit;
