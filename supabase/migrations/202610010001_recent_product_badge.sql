-- Muestra “Recién agregado” durante las primeras 48 horas de cada producto.
-- El panel permite apagar y volver a encender esta etiqueta globalmente.
alter table public.website_settings
  add column if not exists show_recent_product_badge boolean not null default true;

notify pgrst, 'reload schema';
