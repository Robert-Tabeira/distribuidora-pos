import { NextRequest, NextResponse } from 'next/server'
import { isStaffRole, staffHome } from '@/lib/staff-access-policy'
import { STAFF_COOKIE_NAME, staffServerConfigured } from '@/lib/staff-session-token'
import { clearStaffSession, getStaffSession, setStaffSession, staffProfile, staffServerClient } from '@/lib/staff-server-session'
import { privateStaffPath, staffPathKeyAllowed } from '@/lib/staff-private-path.server'

export const dynamic = 'force-dynamic'
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i

function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } })
}

function sameOrigin(request: NextRequest): boolean {
  try { return request.headers.get('sec-fetch-site') !== 'cross-site' && new URL(request.headers.get('origin') || '').origin === request.nextUrl.origin }
  catch { return false }
}

export async function GET(request: NextRequest) {
  if (!staffPathKeyAllowed(request.headers.get('x-staff-access-key'))) return reply({ error: 'No disponible.' }, 404)
  if (!staffServerConfigured()) return reply({ error: 'El acceso del personal requiere configuración del local.' }, 503)
  try {
    const employee = await getStaffSession(request.cookies.get(STAFF_COOKIE_NAME)?.value)
    if (!employee) {
      const response = reply({ error: 'Volvé a iniciar sesión.' }, 401)
      clearStaffSession(response)
      return response
    }
    return reply({ employee })
  } catch { return reply({ error: 'No pudimos comprobar tu acceso. Intentá de nuevo.' }, 503) }
}

export async function POST(request: NextRequest) {
  if (!staffPathKeyAllowed(request.headers.get('x-staff-access-key'))) return reply({ error: 'No disponible.' }, 404)
  if (!sameOrigin(request)) return reply({ error: 'Solicitud inválida.' }, 403)
  if (!staffServerConfigured()) return reply({ error: 'El acceso del personal requiere configuración del local.' }, 503)
  let input
  try { input = await request.json() } catch { return reply({ error: 'Solicitud inválida.' }, 400) }
  try {
    if (!input || typeof input.employee_id !== 'string' || !UUID.test(input.employee_id) || typeof input.pin !== 'string' || !/^\d{4}$/.test(input.pin)) return reply({ error: 'Empleado o PIN inválidos.' }, 400)
    const client = staffServerClient()
    const { data: verification, error } = await client.rpc('verify_pin_secure', { p_employee_id: input.employee_id, p_pin_attempt: input.pin })
    if (error) throw error
    if (verification?.blocked) return reply({ blocked: true, remaining_minutes: verification.remaining_minutes }, 429)
    if (verification?.success !== true) return reply({ success: false, attempts_remaining: verification?.attempts_remaining }, 401)
    const { data: employee, error: profileError } = await client.from('employees').select('id,name,role,created_at,pin').eq('id', input.employee_id).maybeSingle()
    if (profileError) throw profileError
    if (!employee || !isStaffRole(employee.role) || typeof employee.pin !== 'string') return reply({ error: 'No se pudo confirmar el acceso del empleado.' }, 403)
    const response = reply({ success: true, employee: staffProfile(employee), destination: privateStaffPath(staffHome(employee.role)) })
    await setStaffSession(response, employee)
    return response
  } catch { return reply({ error: 'No pudimos verificar el acceso. Intentá de nuevo.' }, 503) }
}

export async function DELETE(request: NextRequest) {
  if (!staffPathKeyAllowed(request.headers.get('x-staff-access-key'))) return reply({ error: 'No disponible.' }, 404)
  if (!sameOrigin(request)) return reply({ error: 'Solicitud inválida.' }, 403)
  const response = reply({ success: true })
  clearStaffSession(response)
  return response
}
