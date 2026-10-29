import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole, type StaffProfile } from '@/lib/staff-access-policy'
import { STAFF_COOKIE_NAME, staffServerConfigured } from '@/lib/staff-session-token'
import { clearStaffSession, getStaffSession, staffServerClient } from '@/lib/staff-server-session'

export const dynamic = 'force-dynamic'
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i
const PROFILE_FIELDS = 'id,name,role,created_at'
function reply(body: object, status = 200) { return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } }) }

async function access(request: NextRequest): Promise<StaffProfile | NextResponse> {
  if (!staffServerConfigured()) return reply({ error: 'El acceso del personal requiere configuración del local.' }, 503)
  const employee = await getStaffSession(request.cookies.get(STAFF_COOKIE_NAME)?.value)
  if (!employee) return reply({ error: 'Volvé a iniciar sesión.' }, 401)
  return employee.role === 'admin' ? employee : reply({ error: 'Esta acción requiere un administrador.' }, 403)
}

function sameOrigin(request: NextRequest): boolean {
  try { return request.headers.get('sec-fetch-site') !== 'cross-site' && new URL(request.headers.get('origin') || '').origin === request.nextUrl.origin }
  catch { return false }
}

function failed(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : ''
  return message.includes('staff_last_admin') ? reply({ error: 'No se puede quitar al último administrador.' }, 409) : reply({ error: 'No pudimos completar el cambio de empleados. Intentá de nuevo.' }, 503)
}

export async function GET(request: NextRequest) {
  try {
    const admin = await access(request)
    if (admin instanceof NextResponse) return admin
    const { data, error } = await staffServerClient().from('employees').select(PROFILE_FIELDS).order('name')
    if (error) throw error
    return reply({ employees: data || [] })
  } catch (error) { return failed(error) }
}

async function save(request: NextRequest, editing: boolean) {
  if (!sameOrigin(request)) return reply({ error: 'Solicitud inválida.' }, 403)
  try {
    const admin = await access(request)
    if (admin instanceof NextResponse) return admin
    let input
    try { input = await request.json() } catch { return reply({ error: 'Solicitud inválida.' }, 400) }
    const name = typeof input?.name === 'string' ? input.name.trim() : ''
    const pin = typeof input?.pin === 'string' ? input.pin : ''
    const id = typeof input?.id === 'string' ? input.id : ''
    if (!name || name.length > 100 || !isStaffRole(input?.role) || (editing && !UUID.test(id))) return reply({ error: 'Completá un nombre y un rol válidos.' }, 400)
    if ((!editing && !/^\d{4}$/.test(pin)) || (pin && !/^\d{4}$/.test(pin))) return reply({ error: 'El PIN debe tener exactamente cuatro dígitos.' }, 400)
    if (editing && id === admin.id && input.role !== 'admin') return reply({ error: 'No podés quitarte tu propio acceso de administrador.' }, 409)
    const client = staffServerClient()
    const changes: { name: string; role: string; pin?: string } = { name, role: input.role }
    if (pin) {
      const { data: hash, error } = await client.rpc('hash_pin', { pin })
      if (error) throw error
      if (typeof hash !== 'string' || !hash) throw new Error('Hash unavailable')
      changes.pin = hash
    }
    const result = editing
      ? await client.from('employees').update(changes).eq('id', id).select(PROFILE_FIELDS).maybeSingle()
      : await client.from('employees').insert(changes).select(PROFILE_FIELDS).single()
    if (result.error) throw result.error
    if (!result.data) return reply({ error: 'El empleado ya no está disponible.' }, 404)
    const reauthenticate = editing && id === admin.id && Boolean(pin)
    const response = reply({ success: true, employee: result.data, reauthenticate })
    if (reauthenticate) clearStaffSession(response)
    return response
  } catch (error) { return failed(error) }
}

export async function POST(request: NextRequest) { return save(request, false) }
export async function PATCH(request: NextRequest) { return save(request, true) }

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ error: 'Solicitud inválida.' }, 403)
  try {
    const admin = await access(request)
    if (admin instanceof NextResponse) return admin
    const id = request.nextUrl.searchParams.get('id') || ''
    if (!UUID.test(id)) return reply({ error: 'Empleado inválido.' }, 400)
    if (id === admin.id) return reply({ error: 'No podés eliminarte a vos mismo.' }, 409)
    const { data, error } = await staffServerClient().from('employees').delete().eq('id', id).select('id').maybeSingle()
    if (error) throw error
    return data ? reply({ deleted_id: data.id }) : reply({ error: 'El empleado ya no está disponible.' }, 404)
  } catch (error) { return failed(error) }
}
