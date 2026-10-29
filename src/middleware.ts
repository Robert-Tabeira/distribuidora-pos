import { NextRequest, NextResponse } from 'next/server'
import { staffArea, staffCanOpen, staffHome } from '@/lib/staff-access-policy'
import { readStaffToken, staffCredentialRevision, staffServerConfigured, STAFF_COOKIE_NAME } from '@/lib/staff-session-token'

function privateResponse(response: NextResponse) {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  return response
}

function login(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.set(STAFF_COOKIE_NAME, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return privateResponse(response)
}

export async function middleware(request: NextRequest) {
  const area = staffArea(request.nextUrl.pathname)
  if (!area) return privateResponse(NextResponse.next())
  if (!staffServerConfigured()) return privateResponse(new NextResponse('El acceso interno requiere configuración del local.', { status: 503 }))
  const session = await readStaffToken(request.cookies.get(STAFF_COOKIE_NAME)?.value)
  if (!session) return login(request)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  try {
    const url = new URL('/rest/v1/employees', process.env.NEXT_PUBLIC_SUPABASE_URL!)
    url.searchParams.set('select', 'id,role,pin')
    url.searchParams.set('id', `eq.${session.id}`)
    url.searchParams.set('limit', '1')
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const result = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store', signal: controller.signal })
    if (!result.ok) throw new Error('Staff lookup unavailable')
    const rows = await result.json()
    const employee = Array.isArray(rows) ? rows[0] : null
    if (!employee || employee.role !== session.role || typeof employee.pin !== 'string' || await staffCredentialRevision(employee.pin) !== session.revision) return login(request)
    if (!staffCanOpen(area, session.role)) return privateResponse(NextResponse.redirect(new URL(staffHome(session.role), request.url)))
    return privateResponse(NextResponse.next())
  } catch {
    return privateResponse(new NextResponse('No pudimos comprobar el acceso interno. Volvé a intentarlo en unos minutos.', { status: 503 }))
  } finally { clearTimeout(timeout) }
}

export const config = {
  matcher: ['/login', '/admin/:path*', '/productos/:path*', '/empleados/:path*', '/descuentos/:path*', '/ubicaciones/:path*', '/precios/:path*', '/mostrador/:path*', '/reposicion/:path*', '/caja/:path*', '/historial/:path*'],
}
