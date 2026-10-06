-- Historial de listas de compras para que cada cliente pueda repetir un pedido.
create table if not exists public.customer_shopping_lists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.customer_shopping_lists enable row level security;

-- No crear una política abierta: la sesión de cliente de localStorage no es
-- una identidad que Postgres pueda verificar. El acceso se habilita cuando
-- las operaciones pasan por autenticación y políticas de propiedad seguras.
drop policy if exists "Allow all" on public.customer_shopping_lists;
revoke all on table public.customer_shopping_lists from anon, authenticated, public;

create index if not exists customer_shopping_lists_customer_created_idx
  on public.customer_shopping_lists (customer_id, created_at desc);
