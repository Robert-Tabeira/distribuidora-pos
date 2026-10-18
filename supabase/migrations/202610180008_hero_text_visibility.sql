-- Controla la visibilidad del título y la descripción del hero por dispositivo.
alter table public.hero_slides
  add column if not exists show_title_mobile boolean not null default true,
  add column if not exists show_title_desktop boolean not null default true,
  add column if not exists show_description_mobile boolean not null default true,
  add column if not exists show_description_desktop boolean not null default true;

notify pgrst, 'reload schema';
