-- Permite definir una versión del logo para el header transparente y tamaños
-- independientes para el estado inicial y el estado sticky.
alter table public.website_settings
  add column if not exists logo_transparent_url text,
  add column if not exists logo_width integer not null default 180,
  add column if not exists logo_sticky_width integer not null default 144;

notify pgrst, 'reload schema';
