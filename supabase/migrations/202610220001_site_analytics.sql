-- Métricas públicas; los registros y reportes no tienen lectura anónima directa.
begin;

create table if not exists public.site_analytics_events (
  id uuid primary key,
  created_at timestamptz not null default now(),
  visitor_id uuid not null,
  session_id uuid not null,
  event_name text not null check (event_name in ('page_view','product_view','search','category_select','inquiry_add','cart_add','whatsapp_inquiry','whatsapp_cart','whatsapp_contact')),
  path text not null check (path in ('/landing','/catalogo')),
  device text not null check (device in ('mobile','tablet','desktop')),
  source text not null,
  product_id uuid,
  category_id uuid,
  search_term text,
  result_count integer,
  item_count integer
);
create index if not exists site_analytics_events_created_idx on public.site_analytics_events (created_at);
create index if not exists site_analytics_events_session_idx on public.site_analytics_events (session_id, created_at);

create table if not exists public.site_analytics_installation (
  id boolean primary key default true check (id),
  started_at timestamptz not null default now()
);
insert into public.site_analytics_installation (id) values (true) on conflict do nothing;

create table if not exists public.site_analytics_admin_sessions (
  token_hash text primary key,
  employee_id uuid not null references public.employees(id) on delete cascade,
  expires_at timestamptz not null
);

alter table public.site_analytics_events enable row level security;
alter table public.site_analytics_installation enable row level security;
alter table public.site_analytics_admin_sessions enable row level security;
revoke all on public.site_analytics_events, public.site_analytics_installation, public.site_analytics_admin_sessions from public, anon, authenticated;

create or replace function public.record_site_events(p_events jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  e jsonb;
  v_session uuid;
  v_product uuid;
  v_category uuid;
  v_search text;
  uuid_pattern constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
begin
  if jsonb_typeof(p_events) is distinct from 'array' then return; end if;
  if jsonb_array_length(p_events) > 15 or octet_length(p_events::text) > 20000 then return; end if;
  for e in select value from jsonb_array_elements(p_events) loop
    if not (coalesce(e->>'id','') ~ uuid_pattern and coalesce(e->>'visitor_id','') ~ uuid_pattern and coalesce(e->>'session_id','') ~ uuid_pattern) then continue; end if;
    if coalesce(e->>'event_name','') not in ('page_view','product_view','search','category_select','inquiry_add','cart_add','whatsapp_inquiry','whatsapp_cart','whatsapp_contact') then continue; end if;
    if coalesce(e->>'path','') not in ('/landing','/catalogo') or coalesce(e->>'device','') not in ('mobile','tablet','desktop') then continue; end if;
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
    insert into public.site_analytics_events (id,visitor_id,session_id,event_name,path,device,source,product_id,category_id,search_term,result_count,item_count)
    values ((e->>'id')::uuid,(e->>'visitor_id')::uuid,v_session,e->>'event_name',e->>'path',e->>'device',
      case when coalesce(e->>'source','') ~ '^[a-zA-Z0-9.\-]{1,120}$' then e->>'source' else 'Directo' end,
      v_product,v_category,case when e->>'event_name' = 'search' then v_search end,
      case when coalesce(e->>'result_count','') ~ '^[0-9]{1,7}$' then (e->>'result_count')::integer end,
      case when coalesce(e->>'item_count','') ~ '^[0-9]{1,5}$' then (e->>'item_count')::integer end)
    on conflict (id) do nothing;
  end loop;
end;
$$;

-- Reuse the existing PIN verification and its account lockout. LocalStorage
-- alone is not authorization to read these metrics.
create or replace function public.site_analytics_login(p_employee_id uuid, p_pin text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, extensions as $$
declare
  result jsonb;
  v_token text;
  v_expires timestamptz := now() + interval '4 hours';
begin
  if not exists (select 1 from public.employees where id = p_employee_id and role = 'admin') then
    return jsonb_build_object('success',false,'message','Necesitás una cuenta de administrador.');
  end if;
  if coalesce(p_pin,'') !~ '^[0-9]{4}$' then
    return jsonb_build_object('success',false,'message','Ingresá el PIN de cuatro dígitos.');
  end if;
  result := public.verify_pin_secure(p_employee_id, p_pin);
  if coalesce((result->>'blocked')::boolean,false) then
    return jsonb_build_object('success',false,'message','Cuenta bloqueada temporalmente. Esperá antes de volver a intentar.');
  end if;
  if not coalesce((result->>'success')::boolean,false) then
    return jsonb_build_object('success',false,'message','PIN incorrecto.');
  end if;
  v_token := gen_random_uuid()::text || gen_random_uuid()::text;
  delete from public.site_analytics_admin_sessions where expires_at < now() or employee_id = p_employee_id;
  insert into public.site_analytics_admin_sessions (token_hash,employee_id,expires_at)
    values (encode(sha256(convert_to(v_token,'UTF8')),'hex'),p_employee_id,v_expires);
  return jsonb_build_object('success',true,'token',v_token,'expires_at',v_expires);
end;
$$;

create or replace function public.site_analytics_logout(p_token text)
returns void language sql security definer set search_path = '' as $$
  delete from public.site_analytics_admin_sessions where token_hash = encode(sha256(convert_to(p_token,'UTF8')),'hex');
$$;

create or replace function public.site_analytics_report(p_token text, p_days integer default 30)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_days integer := greatest(1,least(coalesce(p_days,30),90));
  v_end date := (now() at time zone 'America/Montevideo')::date;
  v_start date;
  v_report jsonb;
begin
  if not exists (
    select 1 from public.site_analytics_admin_sessions s join public.employees e on e.id = s.employee_id
    where s.token_hash = encode(sha256(convert_to(p_token,'UTF8')),'hex') and s.expires_at > now() and e.role = 'admin'
  ) then raise exception 'La sesión de métricas venció. Confirmá tu PIN nuevamente.' using errcode = '42501'; end if;
  v_start := v_end - (v_days - 1);
  with filtered as materialized (
    select *, (created_at at time zone 'America/Montevideo')::date as local_day
    from public.site_analytics_events
    where created_at >= (v_start::timestamp at time zone 'America/Montevideo')
      and created_at < ((v_end + 1)::timestamp at time zone 'America/Montevideo')
  ), totals as (
    select count(distinct session_id) as visits, count(distinct visitor_id) as visitors,
      count(*) filter (where event_name='page_view') as page_views,
      count(distinct session_id) filter (where path='/catalogo') as catalog_visits,
      count(*) filter (where event_name='product_view') as product_views,
      count(*) filter (where event_name='search') as searches,
      count(*) filter (where event_name='inquiry_add') as inquiry_adds,
      count(*) filter (where event_name='cart_add') as cart_adds,
      count(*) filter (where event_name='whatsapp_inquiry') as inquiry_clicks,
      count(*) filter (where event_name='whatsapp_cart') as cart_clicks,
      count(*) filter (where event_name='whatsapp_contact') as contact_clicks,
      count(distinct session_id) filter (where event_name like 'whatsapp_%') as contact_visits
    from filtered
  ), days as (
    select day::date as day from generate_series(v_start::timestamp,v_end::timestamp,interval '1 day') day
  ), daily as (
    select d.day, count(distinct f.session_id) as visits, count(*) filter (where f.event_name='page_view') as views
    from days d left join filtered f on f.local_day=d.day group by d.day order by d.day
  ), product_totals as (
    select product_id, count(*) filter (where event_name='product_view') as views,
      count(*) filter (where event_name='inquiry_add') as inquiries, count(*) filter (where event_name='cart_add') as cart_adds
    from filtered where product_id is not null group by product_id
  ), top_products as (
    select t.*, coalesce(p.name,'Producto eliminado') as name from product_totals t left join public.products p on p.id=t.product_id
    order by views desc, inquiries desc, cart_adds desc, name limit 20
  ), top_searches as (
    select search_term as term,count(*) as searches,count(*) filter (where result_count=0) as no_results
    from filtered where event_name='search' group by search_term order by searches desc,term limit 20
  ), top_categories as (
    select f.category_id, coalesce(c.name,'Categoría eliminada') as name, count(*) as selections
    from filtered f left join public.categories c on c.id=f.category_id where f.event_name='category_select'
    group by f.category_id,c.name order by selections desc,name limit 20
  ), devices as (
    select device,count(distinct session_id) as visits from filtered group by device order by visits desc
  ), sources as (
    select source,count(distinct session_id) as visits from filtered group by source order by visits desc,source limit 10
  ), pages as (
    select path,count(*) as views,count(distinct session_id) as visits from filtered where event_name='page_view'
    group by path order by views desc,path
  )
  select jsonb_build_object(
    'from',v_start,'to',v_end,'days',v_days,'timezone','America/Montevideo','generated_at',now(),
    'tracking_started_at',(select started_at from public.site_analytics_installation where id),
    'first_event_at',(select min(created_at) from public.site_analytics_events),
    'summary',(select to_jsonb(t) from totals t),
    'daily',coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from daily d),'[]'::jsonb),
    'products',coalesce((select jsonb_agg(to_jsonb(p) order by p.views desc,p.inquiries desc,p.cart_adds desc,p.name) from top_products p),'[]'::jsonb),
    'searches',coalesce((select jsonb_agg(to_jsonb(s) order by s.searches desc,s.term) from top_searches s),'[]'::jsonb),
    'categories',coalesce((select jsonb_agg(to_jsonb(c) order by c.selections desc,c.name) from top_categories c),'[]'::jsonb),
    'devices',coalesce((select jsonb_agg(to_jsonb(d) order by d.visits desc) from devices d),'[]'::jsonb),
    'sources',coalesce((select jsonb_agg(to_jsonb(s) order by s.visits desc,s.source) from sources s),'[]'::jsonb),
    'pages',coalesce((select jsonb_agg(to_jsonb(p) order by p.views desc,p.path) from pages p),'[]'::jsonb)
  ) into v_report;
  return v_report;
end;
$$;

revoke all on function public.record_site_events(jsonb), public.site_analytics_login(uuid,text), public.site_analytics_logout(text), public.site_analytics_report(text,integer) from public;
grant execute on function public.record_site_events(jsonb), public.site_analytics_login(uuid,text), public.site_analytics_logout(text), public.site_analytics_report(text,integer) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
