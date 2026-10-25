import { NextRequest, NextResponse } from 'next/server'
import { customerServerClient, customerServerConfigured, readCustomerServerSession, clearCustomerServerSession, customerCredentialRevision } from '@/lib/customer-server-session'
import { getUnitsPerBox, isMissingBoxUnitsColumn } from '@/lib/product-packaging'
import { listProductUnits, type ListCatalogProduct, type ShoppingListItem } from '@/lib/customer-shopping-list-types'

const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i
const LIST_FIELDS = 'id,name,created_at,updated_at,items'

function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

type ListAccess = { response: NextResponse } | { client: ReturnType<typeof customerServerClient>; customer: { id: string } }

async function access(request: NextRequest): Promise<ListAccess> {
  if (!customerServerConfigured()) return { response: reply({ error: 'El guardado de listas requiere configuración del local. Tu carrito se conserva.', code: 'not_configured' }, 503) }
  const session = readCustomerServerSession(request)
  if (!session) return { response: reply({ error: 'Volvé a iniciar sesión para guardar o consultar tus listas. Tu carrito se conserva.', code: 'login_required' }, 401) }
  const expectedCustomer = request.headers.get('x-customer-id')
  if (expectedCustomer && expectedCustomer !== session.id) return { response: reply({ error: 'La cuenta abierta cambió. Volvé a iniciar sesión con tu cuenta. Tu carrito se conserva.', code: 'login_required' }, 401) }
  const client = customerServerClient()
  const { data: customer, error } = await client.from('customers').select('id,business_name,approval_status,pin_hash').eq('id', session.id).maybeSingle()
  if (error) throw error
  if (!customer || typeof customer.pin_hash !== 'string' || customerCredentialRevision(customer.pin_hash) !== session.revision) {
    const response = reply({ error: 'Tu sesión venció o cambió la contraseña. Volvé a iniciar sesión. Tu carrito se conserva.', code: 'login_required' }, 401)
    clearCustomerServerSession(response)
    return { response }
  }
  if (customer.approval_status !== 'approved' || !customer.business_name?.trim()) return { response: reply({ error: 'Guardar listas requiere una cuenta de negocio aprobada por el local.' }, 403) }
  const { data: settings, error: settingsError } = await client.from('website_settings').select('customer_orders_enabled').single()
  if (settingsError) throw settingsError
  if (!settings?.customer_orders_enabled) return { response: reply({ error: 'La función de pedidos está desactivada por el local.' }, 403) }
  return { client, customer }
}

function databaseError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  console.error('Error de listas de compras:', code || 'unknown')
  return reply({ error: ['42703', 'PGRST204'].includes(code)
    ? 'El local debe aplicar la actualización de listas editables para usar esta función.'
    : ['42P01', 'PGRST205'].includes(code)
    ? 'El local debe aplicar la migración de listas de compras. Tu carrito se conserva.'
    : 'No pudimos completar la operación con tus listas. Intentá de nuevo. Tu carrito se conserva.' }, 500)
}

async function catalogProducts(client: ReturnType<typeof customerServerClient>, ids?: string[], search = ''): Promise<ListCatalogProduct[]> {
  if (ids?.length === 0) return []
  if (ids && ids.length > 100) {
    const chunks: string[][] = []
    for (let index = 0; index < ids.length; index += 100) chunks.push(ids.slice(index, index + 100))
    return (await Promise.all(chunks.map(chunk => catalogProducts(client, chunk)))).flat()
  }
  const term = `%${search.replace(/[\\%_]/g, '\\$&')}%`
  const query = client.from('products').select('id,name,unit,units_per_box,gallery').eq('status', 'complete').eq('visible_in_catalog', true)
  const result = ids ? await query.in('id', ids) : await query.ilike('name', term).order('name').limit(12)
  let rows = result.data
  if (isMissingBoxUnitsColumn(result.error)) {
    const legacyQuery = client.from('products').select('id,name,unit,gallery').eq('status', 'complete').eq('visible_in_catalog', true)
    const legacy = ids ? await legacyQuery.in('id', ids) : await legacyQuery.ilike('name', term).order('name').limit(12)
    if (legacy.error) throw legacy.error
    rows = (legacy.data || []).map(product => ({ ...product, units_per_box: null }))
  } else if (result.error) throw result.error
  return (rows || []).map(product => ({
    id: product.id, name: product.name, units: Array.isArray(product.unit) ? product.unit : [product.unit],
    units_per_box: getUnitsPerBox(product), image_url: product.gallery?.[0] || null,
  }))
}

async function buildSnapshots(client: ReturnType<typeof customerServerClient>, rawItems: unknown): Promise<{ items: ShoppingListItem[] } | { response: NextResponse }> {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 500) return { response: reply({ error: 'La lista debe contener entre 1 y 500 artículos.' }, 400) }
  const items: Array<{ product_id: string; quantity: number; unit: string; notes: string }> = []
  for (const item of rawItems) {
    if (!item || typeof item.product_id !== 'string' || !UUID.test(item.product_id)
      || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1_000_000
      || !['unidad', 'caja', 'funda'].includes(item.unit) || (item.notes !== undefined && typeof item.notes !== 'string')
      || (item.notes?.length || 0) > 300) return { response: reply({ error: 'Revisá los productos, cantidades y presentaciones antes de guardar.' }, 400) }
    items.push({ product_id: item.product_id, quantity: item.quantity, unit: item.unit, notes: (item.notes || '').trim() })
  }
  const products = await catalogProducts(client, [...new Set(items.map(item => item.product_id))])
  const snapshots: ShoppingListItem[] = []
  for (const item of items) {
    const product = products.find(entry => entry.id === item.product_id)
    if (!product || !listProductUnits(product).includes(item.unit)) return { response: reply({ error: 'Un producto o su presentación ya no está disponible. Quitalo de la lista o elegí una presentación vigente.' }, 400) }
    snapshots.push({ ...item, product_name: product.name, units_per_box: item.unit === 'caja' ? product.units_per_box : null, image_url: product.image_url })
  }
  return { items: snapshots }
}

export async function GET(request: NextRequest) {
  try {
    const result = await access(request)
    if ('response' in result) return result.response
    const params = request.nextUrl.searchParams
    if (params.get('catalog') === '1') {
      const search = (params.get('search') || '').trim().slice(0, 80)
      return reply({ products: search.length < 2 ? [] : await catalogProducts(result.client, undefined, search) })
    }
    const id = params.get('id')
    if (id) {
      if (!UUID.test(id)) return reply({ error: 'La lista solicitada no es válida.' }, 400)
      const { data, error } = await result.client.from('customer_shopping_lists').select(LIST_FIELDS).eq('id', id).eq('customer_id', result.customer.id).maybeSingle()
      if (error) throw error
      if (!data) return reply({ error: 'No encontramos esa lista en tu cuenta.' }, 404)
      const items = Array.isArray(data.items) ? data.items as ShoppingListItem[] : []
      const products = await catalogProducts(result.client, [...new Set(items.map(item => item.product_id))])
      return reply({ list: { ...data, items }, products })
    }
    const { data, error } = await result.client.from('customer_shopping_lists').select(LIST_FIELDS)
      .eq('customer_id', result.customer.id).order('created_at', { ascending: false })
    if (error) throw error
    return reply({ lists: data || [] })
  } catch (error) { return databaseError(error) }
}

export async function POST(request: NextRequest) {
  try {
    const result = await access(request)
    if ('response' in result) return result.response
    let body: unknown
    try { body = await request.json() } catch { return reply({ error: 'La lista recibida no es válida.' }, 400) }
    const rawItems = body && typeof body === 'object' && 'items' in body ? body.items : null
    const snapshots = await buildSnapshots(result.client, rawItems)
    if ('response' in snapshots) return snapshots.response
    const { data, error } = await result.client.from('customer_shopping_lists').insert({ customer_id: result.customer.id, items: snapshots.items }).select(LIST_FIELDS).single()
    if (error) throw error
    return reply({ list: data }, 201)
  } catch (error) { return databaseError(error) }
}

export async function PATCH(request: NextRequest) {
  try {
    const result = await access(request)
    if ('response' in result) return result.response
    let body: unknown
    try { body = await request.json() } catch { return reply({ error: 'La lista recibida no es válida.' }, 400) }
    if (!body || typeof body !== 'object' || !('id' in body) || typeof body.id !== 'string' || !UUID.test(body.id)
      || !('name' in body) || typeof body.name !== 'string' || body.name.trim().length > 80
      || !('updated_at' in body) || typeof body.updated_at !== 'string' || !Number.isFinite(Date.parse(body.updated_at))) return reply({ error: 'Revisá el nombre de la lista e intentá de nuevo.' }, 400)
    const { data: existing, error: readError } = await result.client.from('customer_shopping_lists').select('id,updated_at').eq('id', body.id).eq('customer_id', result.customer.id).maybeSingle()
    if (readError) throw readError
    if (!existing) return reply({ error: 'No encontramos esa lista en tu cuenta.' }, 404)
    if (existing.updated_at !== body.updated_at) return reply({ error: 'Esta lista cambió en otra ventana. Cerrala y volvé a abrirla para editar la última versión.' }, 409)
    const snapshots = await buildSnapshots(result.client, 'items' in body ? body.items : null)
    if ('response' in snapshots) return snapshots.response
    const { data, error } = await result.client.from('customer_shopping_lists')
      .update({ name: body.name.trim(), items: snapshots.items, updated_at: new Date().toISOString() })
      .eq('id', body.id).eq('customer_id', result.customer.id).eq('updated_at', body.updated_at).select(LIST_FIELDS).maybeSingle()
    if (error) throw error
    if (!data) return reply({ error: 'La lista cambió mientras la editabas. Cerrala y volvé a abrirla antes de guardar.' }, 409)
    return reply({ list: data })
  } catch (error) { return databaseError(error) }
}

export async function DELETE() {
  const response = reply({ success: true })
  clearCustomerServerSession(response)
  return response
}
