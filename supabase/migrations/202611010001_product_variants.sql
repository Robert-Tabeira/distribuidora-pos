-- Variantes identificadas de forma estable dentro de un producto.
begin;

create or replace function public.valid_product_variants(value jsonb)
returns boolean language plpgsql immutable parallel safe as $$
declare
  entry jsonb;
  ids text[] := '{}';
  names text[] := '{}';
  name_key text;
begin
  if jsonb_typeof(value) is distinct from 'array' then return false; end if;
  if jsonb_array_length(value) > 50 then return false; end if;
  for entry in select * from jsonb_array_elements(value) loop
    if jsonb_typeof(entry) is distinct from 'object'
      or jsonb_typeof(entry->'id') is distinct from 'string'
      or (entry->>'id') !~* '^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$'
      or jsonb_typeof(entry->'name') is distinct from 'string'
      or length(btrim(entry->>'name')) not between 1 and 80
      or jsonb_typeof(entry->'is_active') is distinct from 'boolean' then return false; end if;
    name_key := lower(btrim(entry->>'name'));
    if (entry->>'id') = any(ids) or name_key = any(names) then return false; end if;
    ids := array_append(ids, entry->>'id');
    names := array_append(names, name_key);
  end loop;
  return true;
end;
$$;

alter table public.products add column if not exists variants jsonb not null default '[]'::jsonb;
alter table public.products drop constraint if exists products_variants_valid;
alter table public.products add constraint products_variants_valid check (public.valid_product_variants(variants));
grant select (variants) on table public.products to anon, authenticated;

notify pgrst, 'reload schema';
commit;
