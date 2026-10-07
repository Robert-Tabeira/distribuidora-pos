import { NextRequest, NextResponse } from 'next/server'
import { getActiveEmployeeSession } from '@/lib/employee-session'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const publicReadTables = new Set([
  'products', 'categories', 'discounts', 'product_discounts', 'special_product_discounts',
  'website_settings', 'hero_slides', 'landing_sections', 'announcement_messages',
  'announcement_bar_settings', 'menu_links', 'header_settings', 'popups',
])

// Proyección cerrada: una consulta pública nunca recibe columnas internas de la tabla.
const publicColumns: Record<string, string> = {
  products: 'id,name,unit,category_id,status,created_at,price_lista1_kg,price_lista1_unidad,price_lista1_caja,price_lista1_funda,price_lista1_litro,gallery,description,visible_in_catalog',
  categories: 'id,name,order_position,created_at,parent_id,icon,color,show_in_catalog',
  discounts: 'id,name,description,percentage,color,is_active,created_at,updated_at',
  product_discounts: 'id,product_id,discount_id,created_at',
  special_product_discounts: 'id,product_id,name,description,original_price,fixed_price,is_active,created_at,updated_at',
  website_settings: 'id,phone_number,email,address,business_hours,show_phone,show_email,show_address,show_business_hours,customer_orders_enabled,show_recent_product_badge,color_palette,site_name,site_tagline,logo_url,use_logo_image,footer_settings,logo_link_url',
  hero_slides: 'id,order_position,image_url,title,description,cta_text,cta_url,is_active',
  landing_sections: 'id,section_name,title,subtitle,description,image_url,is_visible,block_type,order_position,settings',
  announcement_messages: 'id,message,icon,link_text,link_url,order_position,is_active',
  announcement_bar_settings: 'id,bg_color,text_color,font_family,font_size,font_weight,letter_spacing,animation',
  menu_links: 'id,label,url,order_position,is_active',
  header_settings: 'id,bg_color,text_color,active_color,sticky,shadow,nav_uppercase,nav_underline,nav_letter_spacing,nav_font_weight',
  popups: 'id,name,is_active,content_mode,title,message,image_url,cta_text,cta_url,bg_color,text_color,button_bg_color,button_text_color,clickable_image_url,clickable_image_link,trigger_on_load,trigger_on_load_delay,trigger_on_scroll,trigger_on_scroll_percent,trigger_on_exit,show_on_landing,show_on_catalogo,show_once_per_session,order_position,border_style,border_width,border_color,border_radius,dash_length,dash_gap,shape',
}

const publicFilterColumns: Record<string, Set<string>> = {
  products: new Set(['id', 'name', 'category_id', 'status', 'created_at', 'visible_in_catalog']),
  categories: new Set(['id', 'name', 'parent_id', 'show_in_catalog', 'order_position']),
  discounts: new Set(['id', 'is_active', 'created_at']),
  product_discounts: new Set(['id', 'product_id', 'discount_id']),
  special_product_discounts: new Set(['id', 'product_id', 'is_active']),
  website_settings: new Set(['id']),
  hero_slides: new Set(['id', 'is_active', 'order_position']),
  landing_sections: new Set(['id', 'is_visible', 'order_position', 'section_name']),
  announcement_messages: new Set(['id', 'is_active', 'order_position']),
  announcement_bar_settings: new Set(['id']),
  menu_links: new Set(['id', 'is_active', 'order_position']),
  header_settings: new Set(['id']),
  popups: new Set(['id', 'is_active', 'order_position']),
}

const adminTables = new Set([
  'customers', 'customer_shopping_lists', 'unit_types', 'discounts',
  'product_discounts', 'special_product_discounts', 'website_settings', 'hero_slides',
  'landing_sections', 'announcement_messages', 'announcement_bar_settings', 'menu_links',
  'header_settings', 'popups',
])

function canUseStaffTable(role: string, table: string, method: string) {
  if (role === 'admin') return true
  if (table === 'categories' || table === 'products') {
    if (method === 'GET' || method === 'HEAD') return true
    return role === 'mostrador' && table === 'products' && method === 'PATCH'
  }
  if (table === 'employees') return ['GET', 'HEAD'].includes(method)
  if (table === 'orders') {
    if (role === 'caja') return ['GET', 'HEAD', 'PATCH'].includes(method)
    if (role === 'mostrador') return method === 'POST'
  }
  if (table === 'order_items') {
    if (role === 'caja') return ['GET', 'HEAD'].includes(method)
    if (role === 'mostrador') return method === 'POST'
  }
  if (table === 'reposicion_items' && role === 'mostrador') return ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'].includes(method)
  return false
}

async function handle(request: NextRequest, path: string[]) {
  const [apiVersion, resource, ...resourcePath] = path
  if (!['rest', 'storage'].includes(apiVersion) || !resource) {
    return NextResponse.json({ message: 'Ruta no permitida' }, { status: 404 })
  }

  const method = request.method.toUpperCase()
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ message: 'Origen no permitido' }, { status: 403 })
  }
  const session = await getActiveEmployeeSession()
  const table = apiVersion === 'rest' && resource === 'v1' && resourcePath[0] !== 'rpc' ? resourcePath[0] : null
  // Las consultas del administrador necesitan el esquema completo de tablas
  // (por ejemplo, categorías y productos desde el panel). La proyección pública
  // se aplica solo a visitantes y empleados sin rol de administrador.
  const isPublicRead = session?.role !== 'admin' && table !== null && ['GET', 'HEAD'].includes(method) && publicReadTables.has(table)
  const isAdminStorage = apiVersion === 'storage' && session?.role === 'admin'
  const isAdminHashPin = apiVersion === 'rest' && resourcePath.length === 2 && resourcePath[0] === 'rpc' && resourcePath[1] === 'hash_pin' && method === 'POST' && session?.role === 'admin'

  if (!isPublicRead && !isAdminStorage && !isAdminHashPin) {
    if (!session) return NextResponse.json({ message: 'No autenticado' }, { status: 401 })
    if (
      !table ||
      (adminTables.has(table) && session.role !== 'admin') ||
      !canUseStaffTable(session.role, table, method)
    ) return NextResponse.json({ message: 'Sin permisos' }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ message: 'Acceso al servidor no configurado' }, { status: 503 })
  }

  // Solo se permite leer tablas públicas directamente; no funciones RPC ni rutas anidadas.
  if (isPublicRead && (resourcePath.length !== 1 || request.nextUrl.searchParams.has('columns'))) {
    return NextResponse.json({ message: 'Consulta pública no permitida' }, { status: 403 })
  }
  if (isPublicRead && table) {
    const allowedFilters = publicFilterColumns[table] || new Set<string>()
    for (const key of request.nextUrl.searchParams.keys()) {
      if (['select', 'limit', 'offset'].includes(key)) continue
      if (key === 'order') {
        const orderFields = (request.nextUrl.searchParams.get(key) || '').split(',').map(value => value.trim().split('.')[0])
        if (orderFields.some(field => !publicColumns[table].split(',').includes(field))) {
          return NextResponse.json({ message: 'Orden no permitido' }, { status: 400 })
        }
        continue
      }
      if (!allowedFilters.has(key)) return NextResponse.json({ message: 'Filtro público no permitido' }, { status: 400 })
    }
  }
  if (isPublicRead && /[!()]/.test(request.nextUrl.searchParams.get('select') || '')) {
    return NextResponse.json({ message: 'No se permiten relaciones en la consulta pública' }, { status: 400 })
  }

  // Mostrador solo puede actualizar la ubicación física del producto.
  if (session?.role === 'mostrador' && table === 'products' && method === 'PATCH') {
    let payload: unknown
    try { payload = await request.clone().json() } catch { payload = null }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).some(key => key !== 'location')) {
      return NextResponse.json({ message: 'Solo se permite cambiar la ubicación' }, { status: 403 })
    }
  }

  const upstreamUrl = new URL(`/${path.join('/')}`, supabaseUrl)
  upstreamUrl.search = request.nextUrl.search
  if (isPublicRead && table) {
    upstreamUrl.searchParams.set('select', publicColumns[table])
    if (table === 'products') {
      upstreamUrl.searchParams.set('status', 'eq.complete')
      upstreamUrl.searchParams.set('visible_in_catalog', 'eq.true')
    }
    if (['discounts', 'special_product_discounts', 'hero_slides', 'announcement_messages', 'menu_links', 'popups'].includes(table)) {
      upstreamUrl.searchParams.set('is_active', 'eq.true')
    }
    if (table === 'landing_sections') upstreamUrl.searchParams.set('is_visible', 'eq.true')
    if (table === 'categories') upstreamUrl.searchParams.set('show_in_catalog', 'not.is.false')
  }
  if (table === 'employees' && session?.role !== 'admin') upstreamUrl.searchParams.set('select', 'id,name,role,created_at')

  if (session?.role === 'mostrador' && table === 'reposicion_items') {
    upstreamUrl.searchParams.set('employee_id', `eq.${session.id}`)
  }
  if (session?.role === 'caja' && table === 'orders') {
    upstreamUrl.searchParams.set('status', method === 'PATCH' ? 'eq.sent' : 'eq.sent')
  }

  const headers = new Headers({
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  })
  for (const key of ['accept', 'content-type', 'prefer', 'range', 'range-unit', 'x-upsert']) {
    const value = request.headers.get(key)
    if (value) headers.set(key, value)
  }
  if (apiVersion === 'rest') {
    headers.set('accept-profile', 'public')
    headers.set('content-profile', 'public')
  }

  let body: BodyInit | undefined
  if (!['GET', 'HEAD'].includes(method)) {
    if (session?.role === 'mostrador' && table === 'orders' && method === 'POST') {
      let payload: any
      try { payload = await request.json() } catch { payload = null }
      if (!payload || Array.isArray(payload) || typeof payload !== 'object' || Object.keys(payload).some(key => !['customer_name', 'employee_id', 'status', 'sent_at'].includes(key))) {
        return NextResponse.json({ message: 'Datos del pedido inválidos' }, { status: 400 })
      }
      body = JSON.stringify({ ...payload, employee_id: session.id, status: 'sent', sent_at: new Date().toISOString() })
      headers.set('content-type', 'application/json')
    } else if (session?.role === 'mostrador' && table === 'order_items' && method === 'POST') {
      let payload: any
      try { payload = await request.json() } catch { payload = null }
      const items = Array.isArray(payload) ? payload : [payload]
      const allowedItemFields = new Set(['order_id', 'product_id', 'product_name', 'quantity', 'weight', 'volume', 'box_detail', 'notes'])
      if (!items.length || items.some(item =>
        !item || typeof item !== 'object' || typeof item.order_id !== 'string' ||
        Object.keys(item).some(key => !allowedItemFields.has(key))
      )) {
        return NextResponse.json({ message: 'Artículos del pedido inválidos' }, { status: 400 })
      }
      const orderIds = [...new Set(items.map(item => item.order_id))]
      const ownedOrdersResult = await getSupabaseAdmin()
        .from('orders').select('id').eq('employee_id', session.id).in('id', orderIds)
      const ownedOrders = ownedOrdersResult.data as any[] | null
      const ownedOrdersError = ownedOrdersResult.error
      if (ownedOrdersError || (ownedOrders?.length || 0) !== orderIds.length) {
        return NextResponse.json({ message: 'El pedido no pertenece a esta sesión' }, { status: 403 })
      }
      body = JSON.stringify(payload)
      headers.set('content-type', 'application/json')
    } else if (session?.role === 'mostrador' && table === 'reposicion_items' && method === 'POST') {
      let payload: any
      try { payload = await request.json() } catch { payload = null }
      if (!payload || Array.isArray(payload) || typeof payload !== 'object' || Object.keys(payload).some(key => !['employee_id', 'product_id', 'product_name', 'quantity', 'checked'].includes(key))) {
        return NextResponse.json({ message: 'Artículo de reposición inválido' }, { status: 400 })
      }
      body = JSON.stringify({ ...payload, employee_id: session.id })
      headers.set('content-type', 'application/json')
    } else if (session?.role === 'mostrador' && table === 'reposicion_items' && method === 'PATCH') {
      try {
        const payload = await request.clone().json()
        if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).some(key => !['quantity', 'checked'].includes(key))) {
          return NextResponse.json({ message: 'Actualización de reposición inválida' }, { status: 400 })
        }
      } catch {
        return NextResponse.json({ message: 'Actualización de reposición inválida' }, { status: 400 })
      }
      body = await request.arrayBuffer()
    } else if (session?.role === 'caja' && table === 'orders' && method === 'PATCH') {
      let payload: any
      try { payload = await request.json() } catch { payload = null }
      if (!payload || Object.keys(payload).some(key => !['status', 'completed_at'].includes(key)) || payload.status !== 'completed') {
        return NextResponse.json({ message: 'Actualización de caja inválida' }, { status: 400 })
      }
      body = JSON.stringify({ status: 'completed', completed_at: new Date().toISOString() })
      headers.set('content-type', 'application/json')
    } else {
      body = await request.arrayBuffer()
    }
    if (body instanceof ArrayBuffer && body.byteLength > 12 * 1024 * 1024) {
      return NextResponse.json({ message: 'El archivo supera el tamaño permitido' }, { status: 413 })
    }
  }
  const upstream = await fetch(upstreamUrl, { method, headers, body, cache: 'no-store' })
  const responseHeaders = new Headers()
  for (const key of ['content-type', 'content-range', 'range-unit', 'preference-applied', 'location']) {
    const value = upstream.headers.get(key)
    if (value) responseHeaders.set(key, value)
  }
  responseHeaders.set('Cache-Control', 'no-store')
  return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders })
}

type RouteContext = { params: { path: string[] } }
export async function GET(request: NextRequest, context: RouteContext) { return handle(request, context.params.path) }
export async function HEAD(request: NextRequest, context: RouteContext) { return handle(request, context.params.path) }
export async function POST(request: NextRequest, context: RouteContext) { return handle(request, context.params.path) }
export async function PATCH(request: NextRequest, context: RouteContext) { return handle(request, context.params.path) }
export async function PUT(request: NextRequest, context: RouteContext) { return handle(request, context.params.path) }
export async function DELETE(request: NextRequest, context: RouteContext) { return handle(request, context.params.path) }
