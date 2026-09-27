-- Datos comerciales y autorización previa para cuentas nuevas.
alter table public.customers
  add column if not exists business_name text,
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected'));

-- Clientes ya registrados antes de implementar solicitudes se consideran
-- conocidos y mantienen su acceso. Las solicitudes nuevas quedan pendientes.
update public.customers
set business_name = coalesce(nullif(business_name, ''), name),
    approval_status = case
      when business_name is null or business_name = '' then 'approved'
      else approval_status
    end;

create index if not exists customers_approval_status_created_idx
  on public.customers (approval_status, created_at desc);
