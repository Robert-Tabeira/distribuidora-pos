import { NextResponse } from 'next/server'
import { EMPLOYEE_SESSION_COOKIE, employeeSessionCookieOptions } from '@/lib/employee-session'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(EMPLOYEE_SESSION_COOKIE, '', { ...employeeSessionCookieOptions, maxAge: 0 })
  return response
}
