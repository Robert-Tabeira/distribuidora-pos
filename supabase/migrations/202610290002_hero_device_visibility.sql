-- Visibilidad de cada hero por dispositivo; los existentes siguen visibles.
begin;

alter table public.hero_slides
  add column if not exists show_on_mobile boolean not null default true,
  add column if not exists show_on_desktop boolean not null default true;

grant select (show_on_mobile, show_on_desktop) on table public.hero_slides to anon, authenticated;

notify pgrst, 'reload schema';
commit;
