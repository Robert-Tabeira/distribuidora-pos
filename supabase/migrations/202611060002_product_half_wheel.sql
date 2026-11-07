-- Horma y media horma: autorización independiente por producto.
begin;

alter table public.products
  add column if not exists allow_half_wheel boolean not null default false;

grant select (allow_half_wheel) on table public.products to anon, authenticated;

-- Respetar la configuración existente si Horma ya fue creada por el local.
do $$
begin
  if to_regclass('public.unit_types') is not null then
    -- Una tabla vacía usaba estas opciones por defecto en el formulario.
    -- Conservarlas al agregar la primera opción persistida.
    if not exists (select 1 from public.unit_types) then
      insert into public.unit_types (value, label, icon, order_position) values
        ('unidad', 'Unidad', '🔢', 1),
        ('kg', 'Kilo', '⚖️', 2),
        ('litro', 'Litro', '💧', 3),
        ('caja', 'Caja', '📦', 4),
        ('funda', 'Funda', '🛍️', 5);
    end if;
    insert into public.unit_types (value, label, icon, order_position)
      select 'horma', 'Horma', '🧀',
        coalesce((select max(order_position) from public.unit_types), 0) + 1
      where not exists (select 1 from public.unit_types where value = 'horma');
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;
