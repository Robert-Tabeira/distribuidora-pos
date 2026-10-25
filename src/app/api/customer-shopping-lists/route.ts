import { NextRequest, NextResponse } from 'next/server'
import { customerServerClient, customerServerConfigured, readCustomerServerSession, clearCustomerServerSession, customerCredentialRevision } from '@/lib/customer-server-session'
import { getUnitsPerBox, isMissingBoxUnitsColumn } from '@/lib/product-packaging'

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
  return reply({ error: ['42P01', 'PGRST205'].includes(code)
    ? 'El local debe aplicar la migración de listas de compras. Tu carrito se conserva.'
    : 'No pudimos completar la operación con tus listas. Intentá de nuevo. Tu carrito se conserva.' }, 500)
}

export async function GET(request: NextRequest) {
  try {
    const result = await access(request)
    if ('response' in result) return result.response
    const { data, error } = await result.client.from('customer_shopping_lists').select('id,created_at,items')
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
    if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 500) return reply({ error: 'Agregá entre 1 y 500 artículos para guardar la lista.' }, 400)
    const items: Array<{ product_id: string; quantity: number; unit: string; notes: string }> = []
    for (const item of rawItems) {
      if (!item || typeof item.product_id !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(item.product_id)
        || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1_000_000
        || !['unidad', 'caja', 'funda'].includes(item.unit) || (item.notes !== undefined && typeof item.notes !== 'string')
        || (item.notes?.length || 0) > 300) return reply({ error: 'Revisá los productos, cantidades y presentaciones del pedido antes de guardar.' }, 400)
      items.push({ product_id: item.product_id, quantity: item.quantity, unit: item.unit, notes: (item.notes || '').trim() })
    }
    const ids = [...new Set(items.map(item => item.product_id))]
    const productsResult = await result.client.from('products').select('id,name,unit,units_per_box')
      .in('id', ids).eq('status', 'complete').eq('visible_in_catalog', true)
    let products = productsResult.data
    if (isMissingBoxUnitsColumn(productsResult.error)) {
      const legacy = await result.client.from('products').select('id,name,unit').in('id', ids).eq('status', 'complete').eq('visible_in_catalog', true)
      if (legacy.error) throw legacy.error
      products = (legacy.data || []).map(product => ({ ...product, units_per_box: null }))
    } else if (productsResult.error) throw productsResult.error
    const snapshots = []
    for (const item of items) {
      const product = products?.find(entry => entry.id === item.product_id)
      const units = product ? (Array.isArray(product.unit) ? product.unit : [product.unit]) : []
      if (!product || (item.unit !== 'unidad' && !units.includes(item.unit))) return reply({ error: 'Un producto o su presentación ya no está disponible. Actualizá el catálogo y revisá el pedido.' }, 400)
      snapshots.push({ ...item, product_name: product.name, units_per_box: item.unit === 'caja' ? getUnitsPerBox(product) : null })
    }
    const { data, error } = await result.client.from('customer_shopping_lists').insert({ customer_id: result.customer.id, items: snapshots }).select('id,created_at').single()
    if (error) throw error
    return reply({ list: data }, 201)
  } catch (error) { return databaseError(error) }
}

export async function DELETE() {
  const response = reply({ success: true })
  clearCustomerServerSession(response)
  return response
}
