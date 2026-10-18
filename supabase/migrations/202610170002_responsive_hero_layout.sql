-- Permite definir una imagen y encuadre por dispositivo y ubicar el texto
-- del hero de forma independiente en móvil y escritorio.
alter table public.hero_slides
  add column if not exists mobile_image_url text,
  add column if not exists desktop_text_position text not null default 'left',
  add column if not exists mobile_text_position text not null default 'left',
  add column if not exists desktop_image_position text not null default 'center',
  add column if not exists mobile_image_position text not null default 'center',
  add column if not exists title_font text not null default 'lora',
  add column if not exists body_font text not null default 'dm_sans';

notify pgrst, 'reload schema';
