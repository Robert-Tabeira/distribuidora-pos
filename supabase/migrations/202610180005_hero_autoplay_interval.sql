-- Intervalo global, en segundos, entre slides del hero.
alter table public.website_settings
  add column if not exists hero_autoplay_seconds integer not null default 5
  check (hero_autoplay_seconds between 2 and 15);

notify pgrst, 'reload schema';
