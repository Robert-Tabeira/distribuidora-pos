-- Configuración editable del footer, almacenada junto a la configuración general del sitio.
alter table public.website_settings
  add column if not exists footer_settings jsonb not null default '{
    "brand_title": "",
    "description": "Distribuidora oficial de Sarubbi en Uruguay",
    "contact_title": "Contacto",
    "hours_title": "Horarios",
    "copyright_text": "Todos los derechos reservados.",
    "show_contact": true,
    "show_phone": true,
    "show_email": true,
    "show_address": true,
    "show_hours": true
  }'::jsonb;

notify pgrst, 'reload schema';
