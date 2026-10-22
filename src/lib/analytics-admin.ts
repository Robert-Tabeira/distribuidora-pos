import { supabase } from '@/lib/supabase'

export const ANALYTICS_ACCESS_KEY = 'los_primos_analytics_access'
export interface AnalyticsAccess { token: string; expires_at: string; employee_id: string }

export function readAnalyticsAccess(employeeId: string): AnalyticsAccess | null {
  try {
    const saved = JSON.parse(sessionStorage.getItem(ANALYTICS_ACCESS_KEY) || 'null') as AnalyticsAccess | null
    return saved?.employee_id === employeeId && typeof saved.token === 'string' && Date.parse(saved.expires_at) > Date.now() ? saved : null
  } catch { return null }
}

export async function clearAnalyticsAccess(currentToken?: string) {
  let token: string | undefined = currentToken
  try {
    token ||= (JSON.parse(sessionStorage.getItem(ANALYTICS_ACCESS_KEY) || 'null') as AnalyticsAccess | null)?.token
    sessionStorage.removeItem(ANALYTICS_ACCESS_KEY)
  } catch { /* Storage can be unavailable. */ }
  if (token) {
    try { await supabase.rpc('site_analytics_logout', { p_token: token }) } catch { /* It also expires on the server. */ }
  }
}
