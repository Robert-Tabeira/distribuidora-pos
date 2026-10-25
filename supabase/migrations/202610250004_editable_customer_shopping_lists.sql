begin;

alter table public.customer_shopping_lists
  add column if not exists name text not null default '',
  add column if not exists updated_at timestamptz not null default now();

grant select, insert, update on table public.customer_shopping_lists to service_role;

notify pgrst, 'reload schema';
commit;
