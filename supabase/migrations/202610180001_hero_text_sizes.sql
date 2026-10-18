-- Permite ajustar independientemente el tamaño del título y la descripción
-- del hero en móvil y escritorio.
alter table public.hero_slides
  add column if not exists title_size_desktop integer not null default 72,
  add column if not exists title_size_mobile integer not null default 48,
  add column if not exists body_size_desktop integer not null default 24,
  add column if not exists body_size_mobile integer not null default 20;

notify pgrst, 'reload schema';
