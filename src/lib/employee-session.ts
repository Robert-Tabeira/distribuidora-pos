import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const EMPLOYEE_SESSION_COOKIE = 'los_primos_employee_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

export type EmployeeSession = {
  id: string
  name: string
  role: 'mostrador' | 'caja' | 'admin'
  expiresAt: number
}

function getSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('APP_SESSION_SECRET debe tener al menos 32 caracteres')
  }
  return secret
}

function sign(value: string) {
  return createHmac('sha256', getSessionSecret()).update(value).digest('base64url')
}

export function createEmployeeSession(employee: Omit<EmployeeSession, 'expiresAt'>) {
  const payload = Buffer.from(JSON.stringify({
    ...employee,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifyEmployeeSession(token?: string | null): EmployeeSession | null {
  if (!token) return null
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra) return null

  try {
    const expected = Buffer.from(sign(payload))
    const received = Buffer.from(signature)
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null

    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as EmployeeSession
    if (
      !session.id || !session.name ||
      !['admin', 'caja', 'mostrador'].includes(session.role) ||
      !Number.isInteger(session.expiresAt) || session.expiresAt <= Math.floor(Date.now() / 1000)
    ) return null
    return session
  } catch {
    return null
  }
}

export function getEmployeeSession() {
  const token = cookies().get(EMPLOYEE_SESSION_COOKIE)?.value
  return verifyEmployeeSession(token)
}

export async function getActiveEmployeeSession() {
  const session = getEmployeeSession()
  if (!session) return null
  const result = await getSupabaseAdmin()
    .from('employees')
    .select('id, role')
    .eq('id', session.id)
    .maybeSingle()
  const data = result.data as any
  const error = result.error
  if (error || !data || data.role !== session.role) return null
  return session
}

export const employeeSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
}
