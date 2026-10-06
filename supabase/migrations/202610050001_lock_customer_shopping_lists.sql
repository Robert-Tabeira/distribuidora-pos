-- Cierra el acceso anónimo a listas porque el cliente todavía usa una sesión
-- local que no puede verificarse desde RLS.
alter table public.customer_shopping_lists enable row level security;

drop policy if exists "Allow all" on public.customer_shopping_lists;
revoke all on table public.customer_shopping_lists from anon, authenticated, public;

-- Los pedidos de clientes quedan pausados hasta que tengan autenticación
-- verificable y políticas de propiedad. El catálogo público sigue disponible.
update public.website_settings
set customer_orders_enabled = false
where customer_orders_enabled is distinct from false;

notify pgrst, 'reload schema';
