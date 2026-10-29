import { createClient } from '@supabase/supabase-js'
import type { NextResponse } from 'next/server'
import { isStaffRole, type StaffProfile } from '@/lib/staff-access-policy'
import { createStaffToken, readStaffToken, staffCredentialRevision, staffServerConfigured, STAFF_COOKIE_NAME, STAFF_SESSION_SECONDS } from '@/lib/staff-session-token'

export function staffServerClient() {
  if (!staffServerConfigured()) throw new Error('Staff access is not configured')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  })
}

export function staffProfile(employee: StaffProfile): StaffProfile {
  return { id: employee.id, name: employee.name, role: employee.role, created_at: employee.created_at }
}

export async function getStaffSession(cookie: string | undefined): Promise<StaffProfile | null> {
  const session = await readStaffToken(cookie)
  if (!session) return null
  const { data, error } = await staffServerClient().from('employees').select('id,name,role,created_at,pin').eq('id', session.id).maybeSingle()
  if (error) throw error
  if (!data || !isStaffRole(data.role) || data.role !== session.role || typeof data.pin !== 'string' || await staffCredentialRevision(data.pin) !== session.revision) return null
  return staffProfile(data)
}

export async function setStaffSession(response: NextResponse, employee: StaffProfile & { pin: string }) {
  response.cookies.set(STAFF_COOKIE_NAME, await createStaffToken(employee), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: STAFF_SESSION_SECONDS,
  })
}

export function clearStaffSession(response: NextResponse) {
  response.cookies.set(STAFF_COOKIE_NAME, '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0,
  })
}
