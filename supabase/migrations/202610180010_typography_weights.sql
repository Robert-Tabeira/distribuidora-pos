-- Permite ajustar el peso tipográfico de los principales espacios públicos.
alter table public.hero_slides
  add column if not exists title_font_weight integer not null default 900,
  add column if not exists body_font_weight integer not null default 400;

alter table public.header_settings
  add column if not exists brand_font_weight integer not null default 900;

alter table public.popups
  add column if not exists font_weight integer not null default 400;

-- El navegador puede leer estos valores para representar el diseño guardado.
grant select (title_font_weight, body_font_weight) on table public.hero_slides to anon, authenticated;
grant select (brand_font_weight) on table public.header_settings to anon, authenticated;
grant select (font_weight) on table public.popups to anon, authenticated;

notify pgrst, 'reload schema';
