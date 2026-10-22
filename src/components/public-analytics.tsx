'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { flushSiteAnalytics, trackSiteEvent } from '@/lib/site-analytics'

export function PublicAnalytics() {
  const pathname = usePathname()
  useEffect(() => {
    trackSiteEvent('page_view')
    const hide = () => { if (document.visibilityState === 'hidden') void flushSiteAnalytics() }
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
    window.addEventListener('pagehide', leave)
    return () => {
      document.removeEventListener('visibilitychange', hide)
      document.removeEventListener('click', click)
      window.removeEventListener('pagehide', leave)
      void flushSiteAnalytics()
    }
  }, [pathname])
  return null
}
