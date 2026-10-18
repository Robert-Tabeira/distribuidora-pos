'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function SiteFaviconLoader() {
  useEffect(() => {
    let active = true

    async function loadFavicon() {
      const { data, error } = await supabase
        .from('website_settings')
        .select('favicon_url')
        .single()

      if (error || !active) return

      const existing = document.querySelector<HTMLLinkElement>('link[data-site-favicon]')
      if (!data?.favicon_url) {
        existing?.remove()
        return
      }

      const link = existing || document.createElement('link')
      const path = new URL(data.favicon_url, window.location.origin).pathname.toLowerCase()
      link.rel = 'icon'
      link.href = data.favicon_url
      link.type = path.endsWith('.svg') ? 'image/svg+xml' : path.endsWith('.ico') ? 'image/x-icon' : 'image/png'
      link.dataset.siteFavicon = 'true'
      if (!existing) document.head.appendChild(link)
    }

    void loadFavicon()
    return () => { active = false }
  }, [])

  return null
}
