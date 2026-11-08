import { NextRequest, NextResponse } from 'next/server'
import { STAFF_COOKIE_NAME, staffServerConfigured } from '@/lib/staff-session-token'
import { getStaffSession, staffServerClient } from '@/lib/staff-server-session'
import { staffPathKeyAllowed } from '@/lib/staff-private-path.server'

export const dynamic = 'force-dynamic'

function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow',
  } })
}

export async function GET(request: NextRequest) {
  if (!staffPathKeyAllowed(request.headers.get('x-staff-access-key'))) return reply({ error: 'No disponible.' }, 404)
  if (!staffServerConfigured()) return reply({ error: 'El acceso del personal requiere configuración del local.' }, 503)

  try {
    const employee = await getStaffSession(request.cookies.get(STAFF_COOKIE_NAME)?.value)
    if (!employee) return reply({ error: 'Volvé a iniciar sesión para consultar las solicitudes.' }, 401)
    if (employee.role !== 'admin') return reply({ error: 'Esta consulta requiere un administrador.' }, 403)

    // Una sola lectura: total exacto y una vista previa breve, sin credenciales
    // ni datos de contacto del cliente.
    const { data, count, error } = await staffServerClient().from('customers')
      .select('id,name,business_name,created_at', { count: 'exact' })
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(5)

    if (error) throw error
    if (count === null) throw new Error('pending_count_unavailable')
    return reply({ count, requests: data || [] })
  } catch {
    return reply({ error: 'No pudimos consultar las solicitudes. Intentá nuevamente.' }, 503)
  }
}
