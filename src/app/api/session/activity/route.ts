import { NextRequest, NextResponse } from 'next/server'
import {
  EMPLOYEE_SESSION_COOKIE,
  employeeSessionCookieOptions,
  getActiveEmployeeSession,
  refreshEmployeeSession,
} from '@/lib/employee-session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
  }

  const session = await getActiveEmployeeSession()
  if (!session) {
    const response = NextResponse.json({ error: 'La sesión venció' }, { status: 401 })
    response.cookies.set(EMPLOYEE_SESSION_COOKIE, '', { ...employeeSessionCookieOptions, maxAge: 0 })
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  const token = refreshEmployeeSession(session)
  const remainingSessionSeconds = Math.max(1, session.expiresAt - Math.floor(Date.now() / 1000))
  const response = NextResponse.json({ ok: true })
  response.cookies.set(EMPLOYEE_SESSION_COOKIE, token, {
    ...employeeSessionCookieOptions,
    maxAge: remainingSessionSeconds,
  })
  response.headers.set('Cache-Control', 'no-store')
  return response
}
