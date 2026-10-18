-- Controla cuánto se oscurece la imagen detrás del header transparente.
alter table public.header_settings
  add column if not exists transparent_darkness integer not null default 16;

notify pgrst, 'reload schema';
