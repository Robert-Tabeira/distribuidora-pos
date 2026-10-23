'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { flushSiteAnalytics, resetSiteAnalytics, trackSiteEvent } from '@/lib/site-analytics'
import { analyticsConsentGranted, PRIVACY_CHANGED, PRIVACY_STORAGE_KEY } from '@/lib/privacy-preferences'

export function PublicAnalytics() {
  const pathname = usePathname()
  useEffect(() => {
    let allowed = false
    const sync = () => {
      const next = analyticsConsentGranted()
      if (next && !allowed) trackSiteEvent('page_view')
      else if (!next) resetSiteAnalytics()
      allowed = next
    }
    const storage = (event: StorageEvent) => { if (event.key === PRIVACY_STORAGE_KEY || event.key === null) sync() }
    sync()
    const hide = () => { if (document.visibilityState === 'hidden') void flushSiteAnalytics(); else if (!analyticsConsentGranted()) resetSiteAnalytics() }
    const leave = () => { void flushSiteAnalytics() }
    const click = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
      if (!target) return
      try {
        const url = new URL(target.href)
        if (url.hostname === 'wa.me' || url.hostname === 'api.whatsapp.com' || url.hostname === 'web.whatsapp.com') trackSiteEvent('whatsapp_contact')
      } catch { /* Ignore non-web links. */ }
    }
    document.addEventListener('visibilitychange', hide)
    document.addEventListener('click', click)
    window.addEventListener(PRIVACY_CHANGED, sync)
    window.addEventListener('storage', storage)
    window.addEventListener('pagehide', leave)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      document.removeEventListener('click', click)
      window.removeEventListener(PRIVACY_CHANGED, sync)
      window.removeEventListener('storage', storage)
      window.removeEventListener('pagehide', leave)
      void flushSiteAnalytics()
    }
  }, [pathname])
  return null
}
