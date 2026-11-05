-- Permitir borrar fichas de productos sin borrar artículos de pedidos anteriores.
-- order_items conserva product_name, quantity, weight, volume, box_detail y notes.
begin;

alter table public.order_items alter column product_id drop not null;

alter table public.order_items
  drop constraint if exists order_items_product_id_fkey;

alter table public.order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id) references public.products(id) on delete set null;

notify pgrst, 'reload schema';
commit;
