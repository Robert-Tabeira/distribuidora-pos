-- Permite fijar el CTA de cada slide a una distancia del borde inferior del hero.
alter table public.hero_slides
  add column if not exists cta_bottom_offset integer;

notify pgrst, 'reload schema';
