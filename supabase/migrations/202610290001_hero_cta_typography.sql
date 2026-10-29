-- Tipografía independiente del botón de cada hero.
begin;

alter table public.hero_slides
  add column if not exists cta_font text,
  add column if not exists cta_font_weight integer
    check (cta_font_weight between 100 and 900 and cta_font_weight % 100 = 0);

-- NULL conserva la tipografía de la descripción para los heroes existentes.
grant select (cta_font, cta_font_weight) on table public.hero_slides to anon, authenticated;

notify pgrst, 'reload schema';
commit;
