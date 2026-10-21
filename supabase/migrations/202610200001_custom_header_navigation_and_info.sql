-- Personalización independiente de los enlaces y el panel de información del header.
alter table public.menu_links
  add column if not exists icon text;

alter table public.header_settings
  add column if not exists nav_text_color text not null default '#374151',
  add column if not exists nav_active_color text not null default '#2563eb',
  add column if not exists nav_transparent_text_color text not null default '#ffffff',
  add column if not exists nav_transparent_active_color text not null default '#ffffff',
  add column if not exists nav_font_family text not null default 'dm_sans',
  add column if not exists nav_show_icons boolean not null default false,
  add column if not exists info_button_label text not null default 'Info',
  add column if not exists info_button_icon text not null default 'info',
  add column if not exists info_button_bg text not null default '#eff6ff',
  add column if not exists info_button_text text not null default '#1d4ed8',
  add column if not exists info_panel_bg text not null default '#ffffff',
  add column if not exists info_panel_border text not null default '#e5e7eb',
  add column if not exists info_title text not null default 'Datos del Negocio',
  add column if not exists info_title_color text not null default '#111827',
  add column if not exists info_label_color text not null default '#6b7280',
  add column if not exists info_value_color text not null default '#111827',
  add column if not exists info_icon_color text not null default '#2563eb',
  add column if not exists info_hover_color text not null default '#1d4ed8',
  add column if not exists info_font_family text not null default 'dm_sans',
  add column if not exists info_font_weight text not null default '400',
  add column if not exists info_title_font_weight text not null default '700',
  add column if not exists info_phone_icon text not null default 'phone',
  add column if not exists info_hours_icon text not null default 'clock',
  add column if not exists info_address_icon text not null default 'location',
  add column if not exists info_email_icon text not null default 'mail';

-- Estos valores de presentación se leen desde el sitio público.
grant select (icon) on table public.menu_links to anon, authenticated;
grant select (
  nav_text_color, nav_active_color, nav_transparent_text_color, nav_transparent_active_color,
  nav_font_family, nav_show_icons,
  info_button_label, info_button_icon, info_button_bg, info_button_text,
  info_panel_bg, info_panel_border, info_title, info_title_color,
  info_label_color, info_value_color, info_icon_color, info_hover_color,
  info_font_family, info_font_weight, info_title_font_weight,
  info_phone_icon, info_hours_icon, info_address_icon, info_email_icon
) on table public.header_settings to anon, authenticated;

notify pgrst, 'reload schema';
