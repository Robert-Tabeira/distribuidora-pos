-- Permite configurar el icono de pestaña desde el editor del sitio.
alter table public.website_settings
  add column if not exists favicon_url text;

grant select (favicon_url) on table public.website_settings to anon, authenticated;

notify pgrst, 'reload schema';
