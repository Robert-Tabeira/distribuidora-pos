-- Bloqueo de acceso directo a Supabase desde el navegador.
-- Aplicar solo después de desplegar la versión que enruta las consultas por
-- las APIs del servidor y de configurar sus variables secretas. Si se aplica
-- antes, el catálogo y el POS dejarán de poder consultar la base.
-- Exportar un backup antes de ejecutar este cambio.

begin;

-- Ningún cliente con la clave pública puede escribir ni leer tablas por defecto.
revoke all privileges on all tables in schema public from anon, authenticated, public;
revoke all privileges on all sequences in schema public from anon, authenticated, public;
revoke execute on all functions in schema public from anon, authenticated, public;
-- La clave service role permanece solo en el servidor y es la única que debe
-- poder ejecutar RPC internas usadas por las rutas server-side.
grant execute on all functions in schema public to service_role;

-- Quita la política permisiva que anulaba las políticas específicas.
do $$
declare
  t record;
begin
  for t in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('drop policy if exists %I on public.%I', 'Allow all', t.tablename);
  end loop;
end;
$$;

-- El navegador ya no sube archivos directo. Se eliminan políticas públicas de
-- escritura sobre Storage; la subida administrativa pasa por la ruta servidor.
do $$
declare
  policy_row record;
begin
  if to_regclass('storage.objects') is null then return; end if;
  alter table storage.objects enable row level security;
  for policy_row in
    select p.polname
    from pg_policy p
    where p.polrelid = 'storage.objects'::regclass
      and p.polcmd in ('*', 'a', 'w', 'd')
      and (
        0 = any(p.polroles)
        or (select oid from pg_roles where rolname = 'anon') = any(p.polroles)
        or (select oid from pg_roles where rolname = 'authenticated') = any(p.polroles)
      )
  loop
    execute format('drop policy if exists %I on storage.objects', policy_row.polname);
  end loop;
end;
$$;

-- El sitio público solo necesita leer información visible del catálogo y el
-- contenido de la landing. Los datos de clientes, empleados, pedidos,
-- reposición y configuración interna quedan sin grants para anon/authenticated.
do $$
declare
  table_name text;
  column_list text;
  public_tables text[] := array[
    'products',
    'categories',
    'discounts',
    'product_discounts',
    'special_product_discounts',
    'website_settings',
    'hero_slides',
    'landing_sections',
    'announcement_messages',
    'announcement_bar_settings',
    'menu_links',
    'header_settings',
    'popups'
  ];
begin
  foreach table_name in array public_tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      column_list := case table_name
        when 'products' then 'id,name,unit,category_id,status,created_at,price_lista1_kg,price_lista1_unidad,price_lista1_caja,price_lista1_funda,price_lista1_litro,gallery,description,visible_in_catalog'
        when 'categories' then 'id,name,order_position,created_at,parent_id,icon,color,show_in_catalog'
        when 'discounts' then 'id,name,description,percentage,color,is_active,created_at,updated_at'
        when 'product_discounts' then 'id,product_id,discount_id,created_at'
        when 'special_product_discounts' then 'id,product_id,name,description,original_price,fixed_price,is_active,created_at,updated_at'
        when 'website_settings' then 'id,phone_number,email,address,business_hours,show_phone,show_email,show_address,show_business_hours,customer_orders_enabled,show_recent_product_badge,color_palette,site_name,site_tagline,logo_url,use_logo_image,footer_settings,logo_link_url'
        when 'hero_slides' then 'id,order_position,image_url,title,description,cta_text,cta_url,is_active'
        when 'landing_sections' then 'id,section_name,title,subtitle,description,image_url,is_visible,block_type,order_position,settings'
        when 'announcement_messages' then 'id,message,icon,link_text,link_url,order_position,is_active'
        when 'announcement_bar_settings' then 'id,bg_color,text_color,font_family,font_size,font_weight,letter_spacing,animation'
        when 'menu_links' then 'id,label,url,order_position,is_active'
        when 'header_settings' then 'id,bg_color,text_color,active_color,sticky,shadow,nav_uppercase,nav_underline,nav_letter_spacing,nav_font_weight'
        when 'popups' then 'id,name,is_active,content_mode,title,message,image_url,cta_text,cta_url,bg_color,text_color,button_bg_color,button_text_color,clickable_image_url,clickable_image_link,trigger_on_load,trigger_on_load_delay,trigger_on_scroll,trigger_on_scroll_percent,trigger_on_exit,show_on_landing,show_on_catalogo,show_once_per_session,order_position,border_style,border_width,border_color,border_radius,dash_length,dash_gap,shape'
      end;
      execute format(
        'grant select (%s) on table public.%I to anon, authenticated',
        (select string_agg(format('%I', btrim(column_item)), ', ') from unnest(string_to_array(column_list, ',')) as column_items(column_item)),
        table_name
      );
      execute format('drop policy if exists %I on public.%I', 'Public read ' || table_name, table_name);
      if table_name = 'products' then
        execute format(
          'create policy %I on public.%I for select to anon, authenticated using (status = %L and visible_in_catalog is true)',
          'Public read ' || table_name,
          table_name,
          'complete'
        );
      elsif table_name in ('discounts', 'special_product_discounts', 'hero_slides', 'announcement_messages', 'menu_links', 'popups') then
        execute format(
          'create policy %I on public.%I for select to anon, authenticated using (is_active is true)',
          'Public read ' || table_name,
          table_name
        );
      elsif table_name = 'categories' then
        execute format(
          'create policy %I on public.%I for select to anon, authenticated using (show_in_catalog is distinct from false)',
          'Public read ' || table_name,
          table_name
        );
      elsif table_name = 'landing_sections' then
        execute format(
          'create policy %I on public.%I for select to anon, authenticated using (is_visible is true)',
          'Public read ' || table_name,
          table_name
        );
      else
        execute format(
          'create policy %I on public.%I for select to anon, authenticated using (true)',
          'Public read ' || table_name,
          table_name
        );
      end if;
    end if;
  end loop;
end;
$$;

-- Las listas de compra y el flujo de pedidos de clientes siguen deshabilitados
-- hasta contar con autenticación comprobable y políticas de propiedad.
do $$
begin
  if to_regclass('public.website_settings') is not null then
    update public.website_settings
    set customer_orders_enabled = false
    where customer_orders_enabled is distinct from false;
  end if;
end;
$$;

notify pgrst, 'reload schema';

commit;
