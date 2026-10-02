-- Extends the existing landing_sections table so every landing block can be
-- rendered, reordered, hidden, and edited from the web editor.
alter table public.landing_sections
  add column if not exists block_type text not null default 'content',
  add column if not exists order_position integer not null default 100,
  add column if not exists settings jsonb not null default '{}'::jsonb;

with ranked_sections as (
  select id, row_number() over (order by section_name, id) as row_number
  from public.landing_sections
)
update public.landing_sections as section
set order_position = 100 + ranked_sections.row_number * 10
from ranked_sections
where section.id = ranked_sections.id
  and section.order_position = 100;

insert into public.landing_sections
  (section_name, title, subtitle, description, image_url, is_visible, block_type, order_position, settings)
select defaults.section_name, defaults.title, defaults.subtitle, defaults.description,
       defaults.image_url, true, defaults.block_type, defaults.order_position, defaults.settings
from (values
  ('Categorías principales', 'Explorá por categoría', 'Encontrá rápido lo que buscás', null::text, null::text, 'categories', 10, '{}'::jsonb),
  ('Banner destacado', 'Todo para tu negocio, en un solo lugar', 'Calidad y atención de confianza', null::text, null::text, 'banner', 20, '{"button_text":"Ver catálogo","button_url":"/catalogo","background_color":"#fff7ed"}'::jsonb),
  ('Bloques destacados', 'Conocé más', null::text, null::text, null::text, 'feature_cards', 30, '{"cards":[{"title":"Calidad para tu negocio","description":"Productos seleccionados para acompañar tu comercio.","image_url":"","link_url":"/catalogo","button_text":"Ver catálogo"},{"title":"Atención cercana","description":"Estamos para ayudarte con tu compra.","image_url":"","link_url":"/catalogo","button_text":"Conocé el catálogo"}]}'::jsonb),
  ('Información del local', 'Estamos para ayudarte', 'Conocé nuestros horarios y formas de contacto', null::text, null::text, 'business_info', 40, '{"show_phone":true,"show_email":true,"show_address":true,"show_business_hours":true}'::jsonb),
  ('Galería de fotos', 'Así trabajamos', null::text, 'Conocé más sobre nuestros productos y nuestro local.', null::text, 'image_carousel', 50, '{"slides":[]}'::jsonb),
  ('Ofertas especiales', 'Ofertas especiales', 'Aprovechá nuestras promociones vigentes', null::text, null::text, 'product_grid', 60, '{"mode":"discounts","limit":4,"button_text":"Ver todas las ofertas","button_url":"/catalogo"}'::jsonb),
  ('Lo más vendido', 'Lo más vendido', 'Los productos preferidos por nuestros clientes', null::text, null::text, 'product_grid', 70, '{"mode":"popular","limit":5,"button_text":"Ver todos los productos","button_url":"/catalogo"}'::jsonb)
) as defaults(section_name, title, subtitle, description, image_url, block_type, order_position, settings)
where not exists (
  select 1 from public.landing_sections as existing
  where lower(existing.section_name) = lower(defaults.section_name)
);
