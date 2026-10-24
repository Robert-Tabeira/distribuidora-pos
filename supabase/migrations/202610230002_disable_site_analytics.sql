-- Disable browser access to internal web analytics, including older deployments.
-- Safe when analytics were never installed. No records or tables are deleted.
begin;

do $$
begin
  if to_regprocedure('public.record_site_events(jsonb)') is not null then
    revoke execute on function public.record_site_events(jsonb) from public, anon, authenticated;
  end if;
  if to_regprocedure('public.site_analytics_login(uuid,text)') is not null then
    revoke execute on function public.site_analytics_login(uuid,text) from public, anon, authenticated;
  end if;
  if to_regprocedure('public.site_analytics_report(text,integer)') is not null then
    revoke execute on function public.site_analytics_report(text,integer) from public, anon, authenticated;
  end if;
end;
$$;

notify pgrst, 'reload schema';
commit;
