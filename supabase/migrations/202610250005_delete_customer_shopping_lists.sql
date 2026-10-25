begin;

grant delete on table public.customer_shopping_lists to service_role;

notify pgrst, 'reload schema';
commit;
