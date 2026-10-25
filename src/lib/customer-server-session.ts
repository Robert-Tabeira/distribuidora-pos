import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'los_primos_customer_session'
const SESSION_SECONDS = 7 * 24 * 60 * 60

export function customerServerConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && key && key !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !key.startsWith('sb_publishable_'))
}

export function customerServerClient() {
  if (!customerServerConfigured()) throw new Error('Customer server access is not configured')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

function signature(payload: string): string {
  return createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update(`customer-session-v1:${payload}`).digest('hex')
}

export function customerCredentialRevision(hash: string): string {
  return createHash('sha256').update(hash).digest('hex')
}

export function setCustomerServerSession(response: NextResponse, customer: { id: string; pin_hash: string }): void {
  if (!customerServerConfigured()) return
  const payload = Buffer.from(JSON.stringify({
    id: customer.id, revision: customerCredentialRevision(customer.pin_hash),
    expires: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  })).toString('base64url')
  response.cookies.set(COOKIE_NAME, `${payload}.${signature(payload)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: SESSION_SECONDS,
  })
}

export function clearCustomerServerSession(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0,
  })
}

export function readCustomerServerSession(request: NextRequest): { id: string; revision: string } | null {
  if (!customerServerConfigured()) return null
  try {
    const cookie = request.cookies.get(COOKIE_NAME)?.value || ''
    if (!cookie || cookie.length > 2048) return null
    const parts = cookie.split('.')
    if (parts.length !== 2 || !/^[a-f0-9]{64}$/.test(parts[1])) return null
    if (!timingSafeEqual(Buffer.from(parts[1], 'hex'), Buffer.from(signature(parts[0]), 'hex'))) return null
    const session = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
    if (!session || typeof session.id !== 'string' || !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(session.id)
      || typeof session.revision !== 'string' || !/^[a-f0-9]{64}$/.test(session.revision)
      || !Number.isSafeInteger(session.expires) || session.expires <= Math.floor(Date.now() / 1000)) return null
    return { id: session.id, revision: session.revision }
  } catch {
    return null
  }
}
