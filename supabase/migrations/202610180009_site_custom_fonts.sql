-- Biblioteca global de tipografías y fuente elegida para el header.
alter table public.website_settings
  add column if not exists custom_fonts jsonb not null default '[]'::jsonb;

alter table public.header_settings
  add column if not exists font_family text not null default 'dm_sans';

alter table public.popups
  add column if not exists font_family text not null default 'dm_sans';

-- El sitio público necesita leer las URLs de fuentes y el estilo del menú.
grant select (custom_fonts) on table public.website_settings to anon, authenticated;
grant select (font_family) on table public.header_settings to anon, authenticated;
grant select (font_family) on table public.popups to anon, authenticated;

notify pgrst, 'reload schema';
