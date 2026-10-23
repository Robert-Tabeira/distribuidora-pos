'use client'

import { analyticsConsentGranted, readPrivacyPreferences } from '@/lib/privacy-preferences'

export type SiteEventName = 'page_view' | 'product_view' | 'search' | 'category_select' | 'inquiry_add' | 'cart_add' | 'whatsapp_inquiry' | 'whatsapp_cart' | 'whatsapp_contact'
type EventDetails = { product_id?: string; category_id?: string; search_term?: string; result_count?: number; item_count?: number }
type QueuedEvent = EventDetails & { id: string; visitor_id: string; session_id: string; event_name: SiteEventName; path: string; device: string; source: string; consent_version: string; consent_at: string; retries: number }
type BrowserSession = { visitor: string; session: string; lastActivity: number; source: string; device: string }
const STORAGE_KEY = 'los_primos_analytics'
let memorySession: BrowserSession | null = null
let queue: QueuedEvent[] = []
let timer: ReturnType<typeof setTimeout> | undefined
let sending = false
let unavailable = false
let activeRequest: AbortController | null = null
const recentEvents = new Map<string, number>()

function excluded() {
  if (!analyticsConsentGranted()) return true
  if (typeof window === 'undefined' || !['/', '/landing', '/catalogo'].includes(window.location.pathname)) return true
  if (['localhost', '127.0.0.1', '::1', '[::1]'].includes(window.location.hostname)) return true
  if (navigator.webdriver || /bot|spider|crawler|headless|lighthouse|pagespeed/i.test(navigator.userAgent)) return true
  if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return true
  try { if (localStorage.getItem('employee')) return true } catch { /* Storage can be blocked. */ }
  return false
}

function session(): BrowserSession {
  let saved = memorySession
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value) saved = JSON.parse(value) as BrowserSession
  } catch { /* Keep the in-memory identifier for this page. */ }
  const now = Date.now()
  const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i
  if (!saved || !uuid.test(saved.visitor) || !uuid.test(saved.session) || !Number.isFinite(saved.lastActivity)) saved = null
  if (!saved || now - saved.lastActivity > 30 * 60 * 1000 || now < saved.lastActivity) {
    let source = 'Directo'
    try {
      const referrer = new URL(document.referrer)
      if (referrer.hostname !== window.location.hostname) source = referrer.hostname.slice(0, 120)
    } catch { /* No external referrer. */ }
    saved = { visitor: saved?.visitor || crypto.randomUUID(), session: crypto.randomUUID(), lastActivity: now, source, device: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop' }
  }
  saved.lastActivity = now
  memorySession = saved
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)) } catch { /* Tracking never blocks the shop. */ }
  return saved
}

export function normalizeSearchTerm(value: string): string {
  const term = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 80)
  // Avoid retaining emails, phone numbers and URLs accidentally entered in search.
  return term.length < 2 || /@|https?:|\d[\d\s()+.-]{6,}\d/.test(term) ? '' : term
}

export function trackSiteEvent(eventName: SiteEventName, details: EventDetails = {}) {
  try {
    if (excluded() || unavailable) return
    const path = window.location.pathname === '/' ? '/landing' : window.location.pathname
    const key = JSON.stringify([eventName, path, details])
    const now = Date.now()
    if (now - (recentEvents.get(key) || 0) < 1200) return
    recentEvents.set(key, now)
    if (recentEvents.size > 100) recentEvents.delete(recentEvents.keys().next().value as string)
    const browser = session()
    const consent = readPrivacyPreferences()!
    queue.push({ ...details, id: crypto.randomUUID(), visitor_id: browser.visitor, session_id: browser.session, event_name: eventName, path, source: browser.source, device: browser.device, consent_version: consent.version, consent_at: consent.updatedAt, retries: 0 })
    if (queue.length > 40) queue.shift()
    if (eventName.startsWith('whatsapp_')) void flushSiteAnalytics()
    else if (!timer) timer = setTimeout(() => void flushSiteAnalytics(), 600)
  } catch { /* Metrics must not interrupt browsing, searching or WhatsApp. */ }
}

export async function flushSiteAnalytics() {
  clearTimeout(timer)
  timer = undefined
  if (!analyticsConsentGranted()) { resetSiteAnalytics(); return }
  if (sending || !queue.length || unavailable) return
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return
  sending = true
  const controller = new AbortController()
  activeRequest = controller
  const batch = queue.splice(0, 15)
  try {
    const response = await fetch(`${url}/rest/v1/rpc/record_site_events`, {
      method: 'POST', keepalive: true, signal: controller.signal,
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_events: batch.map(({ retries, ...event }) => event) })
    })
    if (!response.ok) {
      if ([400, 401, 403, 404].includes(response.status)) unavailable = true
      else throw new Error('Metrics temporarily unavailable')
    }
  } catch {
    if (!controller.signal.aborted && analyticsConsentGranted()) queue = [...batch.filter(event => event.retries < 1).map(event => ({ ...event, retries: event.retries + 1 })), ...queue].slice(0, 40)
  } finally {
    sending = false
    if (activeRequest === controller) activeRequest = null
    if (queue.length && !unavailable && analyticsConsentGranted()) timer = setTimeout(() => void flushSiteAnalytics(), 1500)
  }
}

export function resetSiteAnalytics() {
  clearTimeout(timer)
  timer = undefined
  queue = []
  memorySession = null
  recentEvents.clear()
  activeRequest?.abort()
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* Storage can be blocked. */ }
}
