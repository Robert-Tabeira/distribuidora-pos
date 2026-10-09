-- Historial de listas de compras para que cada cliente pueda repetir un pedido.
create table if not exists public.customer_shopping_lists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.customer_shopping_lists enable row level security;

-- La aplicación autentica clientes con sesión propia en localStorage y usa
-- la clave pública de Supabase; por eso sigue el acceso abierto que usa este
-- proyecto para sus tablas públicas.
drop policy if exists "Allow all" on public.customer_shopping_lists;
create policy "Allow all" on public.customer_shopping_lists
  for all using (true) with check (true);

create index if not exists customer_shopping_lists_customer_created_idx
  on public.customer_shopping_lists (customer_id, created_at desc);
