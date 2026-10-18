-- Permite mostrar la imagen completa o cubrir el área del hero por dispositivo.
alter table public.hero_slides
  add column if not exists desktop_image_fit text not null default 'contain',
  add column if not exists mobile_image_fit text not null default 'contain';

notify pgrst, 'reload schema';
