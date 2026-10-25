begin;

-- Conserva las credenciales anteriores y admite hashes PBKDF2 con sal.
alter table public.customers alter column pin_hash type text;

notify pgrst, 'reload schema';
commit;
