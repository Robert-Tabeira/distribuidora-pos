-- Colores propios del menú desplegable de móvil y tablet.
alter table public.header_settings
  add column if not exists mobile_menu_settings jsonb not null default '{}'::jsonb;

grant select (mobile_menu_settings) on table public.header_settings to anon, authenticated;

notify pgrst, 'reload schema';
