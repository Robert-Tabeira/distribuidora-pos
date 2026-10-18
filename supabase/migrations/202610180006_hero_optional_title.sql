-- Separa el nombre interno del slide del título mostrado en la landing.
alter table public.hero_slides
  add column if not exists internal_name text;

update public.hero_slides
set internal_name = coalesce(nullif(btrim(title), ''), 'Hero ' || coalesce(order_position, 0)::text)
where internal_name is null or btrim(internal_name) = '';

alter table public.hero_slides
  alter column internal_name set default 'Nuevo hero',
  alter column internal_name set not null,
  alter column title drop not null;

notify pgrst, 'reload schema';
