'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { siteFontFaceCss, type SiteFont } from '@/lib/site-fonts'

export function SiteFontLoader() {
  const [fonts, setFonts] = useState<SiteFont[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      const { data, error } = await supabase.from('website_settings').select('custom_fonts').single()
      if (!error && active && Array.isArray(data?.custom_fonts)) setFonts(data.custom_fonts as SiteFont[])
    }
    void load()
    return () => { active = false }
  }, [])

  const css = siteFontFaceCss(fonts)
  return css ? <style id="site-custom-fonts">{css}</style> : null
}
