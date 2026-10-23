-- Records the notice version and acceptance date alongside each optional event.
-- Does not infer consent for existing events or create consent retroactively.
begin;
alter table public.site_analytics_events
  add column if not exists consent_version text,
  add column if not exists consent_at timestamptz;

create or replace function public.record_site_events(p_events jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  e jsonb;
  v_session uuid;
  v_product uuid;
  v_category uuid;
  v_search text;
  v_consent_at timestamptz;
  uuid_pattern constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
begin
  if jsonb_typeof(p_events) is distinct from 'array' then return; end if;
  if jsonb_array_length(p_events) > 15 or octet_length(p_events::text) > 20000 then return; end if;
  for e in select value from jsonb_array_elements(p_events) loop
    if not (coalesce(e->>'id','') ~ uuid_pattern and coalesce(e->>'visitor_id','') ~ uuid_pattern and coalesce(e->>'session_id','') ~ uuid_pattern) then continue; end if;
    if coalesce(e->>'event_name','') not in ('page_view','product_view','search','category_select','inquiry_add','cart_add','whatsapp_inquiry','whatsapp_cart','whatsapp_contact') then continue; end if;
    if coalesce(e->>'path','') not in ('/landing','/catalogo') or coalesce(e->>'device','') not in ('mobile','tablet','desktop') then continue; end if;
    if coalesce(e->>'consent_version','') <> '2026-10-23' then continue; end if;
    if coalesce(e->>'consent_at','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z$' then continue; end if;
    begin
      v_consent_at := (e->>'consent_at')::timestamptz;
    exception when invalid_datetime_format or datetime_field_overflow then
      continue;
    end;
    if v_consent_at > now() + interval '5 minutes' or v_consent_at < now() - interval '181 days' then continue; end if;
    v_session := (e->>'session_id')::uuid;
    -- Limit repeated submissions for one session. Event IDs also deduplicate retries.
    perform pg_advisory_xact_lock(hashtextextended(v_session::text, 0));
    if (select count(*) from public.site_analytics_events where session_id = v_session and created_at > now() - interval '1 minute') >= 60 then continue; end if;
    v_product := case when coalesce(e->>'product_id','') ~ uuid_pattern then (e->>'product_id')::uuid end;
    v_category := case when coalesce(e->>'category_id','') ~ uuid_pattern then (e->>'category_id')::uuid end;
    v_search := left(trim(regexp_replace(lower(coalesce(e->>'search_term','')), '\s+', ' ', 'g')), 80);
    if e->>'event_name' = 'search' and (length(v_search) < 2 or v_search ~ '@|https?:|[0-9][0-9 ()+.\-]{6,}[0-9]') then continue; end if;
    if e->>'event_name' in ('product_view','inquiry_add','cart_add') and v_product is null then continue; end if;
    if e->>'event_name' = 'category_select' and v_category is null then continue; end if;
    insert into public.site_analytics_events (id,visitor_id,session_id,event_name,path,device,source,product_id,category_id,search_term,result_count,item_count,consent_version,consent_at)
    values ((e->>'id')::uuid,(e->>'visitor_id')::uuid,v_session,e->>'event_name',e->>'path',e->>'device',
      case when coalesce(e->>'source','') ~ '^[a-zA-Z0-9.\-]{1,120}$' then e->>'source' else 'Directo' end,
      v_product,v_category,case when e->>'event_name' = 'search' then v_search end,
      case when coalesce(e->>'result_count','') ~ '^[0-9]{1,7}$' then (e->>'result_count')::integer end,
      case when coalesce(e->>'item_count','') ~ '^[0-9]{1,5}$' then (e->>'item_count')::integer end,e->>'consent_version',v_consent_at)
    on conflict (id) do nothing;
  end loop;
end;
$$;

revoke all on function public.record_site_events(jsonb) from public;
grant execute on function public.record_site_events(jsonb) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
