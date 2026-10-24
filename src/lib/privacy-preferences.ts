import { LEGAL_READY } from '@/lib/legal-details'
import { SITE_ANALYTICS_ENABLED } from '@/lib/analytics-config'

export const PRIVACY_VERSION = LEGAL_READY ? '2026-10-23' : '2026-10-23-draft'
export const PRIVACY_STORAGE_KEY = 'los_primos_privacy_preferences'
export const PRIVACY_CHANGED = 'los-primos:privacy-changed'
export const PRIVACY_OPEN = 'los-primos:privacy-open'
export interface PrivacyPreferences {
  version: string
  analytics: boolean
  externalMaps: boolean
  updatedAt: string
  expiresAt: string
}
let temporaryChoice: PrivacyPreferences | null = null

export function browserRejectsAnalytics(): boolean {
  return typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true)
}

export function readPrivacyPreferences(): PrivacyPreferences | null {
  if (typeof window === 'undefined') return null
  let choice = temporaryChoice
  try {
    const raw = localStorage.getItem(PRIVACY_STORAGE_KEY)
    if (raw) choice = JSON.parse(raw) as PrivacyPreferences
  } catch { /* A choice can still apply for this page with blocked storage. */ }
  if (!choice || choice.version !== PRIVACY_VERSION || typeof choice.analytics !== 'boolean' || typeof choice.externalMaps !== 'boolean') return null
  if (!Number.isFinite(Date.parse(choice.updatedAt)) || !Number.isFinite(Date.parse(choice.expiresAt)) || Date.parse(choice.expiresAt) <= Date.now()) return null
  return { ...choice, analytics: SITE_ANALYTICS_ENABLED && choice.analytics }
}

export function analyticsConsentGranted(): boolean {
  return SITE_ANALYTICS_ENABLED && LEGAL_READY && !browserRejectsAnalytics() && readPrivacyPreferences()?.analytics === true
}

export function externalMapsConsentGranted(): boolean {
  return LEGAL_READY && readPrivacyPreferences()?.externalMaps === true
}

export function savePrivacyPreferences(analytics: boolean, externalMaps: boolean): PrivacyPreferences {
  const now = Date.now()
  const choice: PrivacyPreferences = { version: PRIVACY_VERSION, analytics: SITE_ANALYTICS_ENABLED && LEGAL_READY && analytics && !browserRejectsAnalytics(), externalMaps: LEGAL_READY && externalMaps, updatedAt: new Date(now).toISOString(), expiresAt: new Date(now + 180 * 24 * 60 * 60 * 1000).toISOString() }
  try { localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(choice)); temporaryChoice = null }
  catch { temporaryChoice = choice }
  window.dispatchEvent(new Event(PRIVACY_CHANGED))
  return choice
}

export function openPrivacySettings() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PRIVACY_OPEN))
}
