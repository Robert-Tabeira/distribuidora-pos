-- Permite oscurecer la imagen del hero para mejorar el contraste del texto.
alter table public.hero_slides
  add column if not exists image_darkness integer not null default 18;

-- Limpia el ajuste que se había agregado al header por una interpretación
-- incorrecta del pedido.
alter table public.header_settings
  drop column if exists transparent_darkness;

notify pgrst, 'reload schema';
