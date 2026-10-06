-- Bloqueo previo a la puesta en producción.
-- La app todavía autentica empleados/clientes en el navegador, por lo que este
-- cambio corta también el POS hasta completar el reemplazo por sesiones seguras.
-- Aplicar solo luego de exportar un backup de la base.

begin;

-- Ningún cliente con la clave pública puede escribir ni leer tablas por defecto.
revoke all privileges on all tables in schema public from anon, authenticated, public;
revoke all privileges on all sequences in schema public from anon, authenticated, public;
revoke execute on all functions in schema public from anon, authenticated, public;

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

-- El sitio público solo necesita leer información visible del catálogo y el
-- contenido de la landing. Los datos de clientes, empleados, pedidos,
-- reposición y configuración interna quedan sin grants para anon/authenticated.
do $$
declare
  table_name text;
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
      execute format('grant select on table public.%I to anon, authenticated', table_name);
      execute format('drop policy if exists %I on public.%I', 'Public read ' || table_name, table_name);
      execute format(
        'create policy %I on public.%I for select to anon, authenticated using (true)',
        'Public read ' || table_name,
        table_name
      );
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
