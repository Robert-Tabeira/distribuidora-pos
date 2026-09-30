-- Control global para activar o pausar el carrito y los pedidos de clientes.
-- Comienza apagado para que la función quede deshabilitada hasta que un admin
-- decida habilitarla desde Edición Web → Configuración.
alter table public.website_settings
  add column if not exists customer_orders_enabled boolean not null default false;
