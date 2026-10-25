begin;

create table if not exists public.customer_shopping_lists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.customer_shopping_lists enable row level security;
drop policy if exists "Allow all" on public.customer_shopping_lists;
revoke all on table public.customer_shopping_lists from public, anon, authenticated;
grant select, insert on table public.customer_shopping_lists to service_role;

create index if not exists customer_shopping_lists_customer_created_idx
  on public.customer_shopping_lists (customer_id, created_at desc);

notify pgrst, 'reload schema';
commit;
