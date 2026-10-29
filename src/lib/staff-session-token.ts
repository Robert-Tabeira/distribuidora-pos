import { isStaffRole, type StaffRole } from '@/lib/staff-access-policy'

export const STAFF_COOKIE_NAME = 'los_primos_staff_session'
export const STAFF_SESSION_SECONDS = 12 * 60 * 60
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i
interface StaffToken { id: string; role: StaffRole; revision: string; issued: number; expires: number }

export function staffServerConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const secret = process.env.STAFF_SESSION_SECRET
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && key && key !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    && !key.startsWith('sb_publishable_') && (!secret || secret.length >= 32))
}

function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decode(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '='.repeat((4 - base64.length % 4) % 4))
  // Use an owned ArrayBuffer so Web Crypto never receives a SharedArrayBuffer view.
  const buffer = new ArrayBuffer(binary.length)
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return buffer
}

async function signingKey() {
  if (!staffServerConfigured()) throw new Error('Staff access is not configured')
  const secret = process.env.STAFF_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function staffCredentialRevision(pinHash: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pinHash))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function createStaffToken(employee: { id: string; role: StaffRole; pin: string }): Promise<string> {
  const issued = Math.floor(Date.now() / 1000)
  const data: StaffToken = { id: employee.id, role: employee.role, revision: await staffCredentialRevision(employee.pin), issued, expires: issued + STAFF_SESSION_SECONDS }
  const payload = encode(new TextEncoder().encode(JSON.stringify(data)))
  const signature = await crypto.subtle.sign('HMAC', await signingKey(), new TextEncoder().encode(`staff-session-v1:${payload}`))
  return `${payload}.${encode(new Uint8Array(signature))}`
}

export async function readStaffToken(cookie: string | undefined): Promise<StaffToken | null> {
  if (!staffServerConfigured() || !cookie || cookie.length > 2048) return null
  try {
    const parts = cookie.split('.')
    if (parts.length !== 2 || !parts.every(part => /^[a-zA-Z0-9_-]+$/.test(part))) return null
    const valid = await crypto.subtle.verify('HMAC', await signingKey(), decode(parts[1]), new TextEncoder().encode(`staff-session-v1:${parts[0]}`))
    if (!valid) return null
    const data = JSON.parse(new TextDecoder().decode(decode(parts[0])))
    const now = Math.floor(Date.now() / 1000)
    if (!data || typeof data.id !== 'string' || !UUID.test(data.id) || !isStaffRole(data.role)
      || typeof data.revision !== 'string' || !/^[a-f0-9]{64}$/.test(data.revision)
      || !Number.isSafeInteger(data.issued) || data.issued > now + 30
      || !Number.isSafeInteger(data.expires) || data.expires <= now || data.expires - data.issued !== STAFF_SESSION_SECONDS) return null
    return data as StaffToken
  } catch { return null }
}
