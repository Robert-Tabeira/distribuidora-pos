'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FooterDesign } from '@/components/footer-design'
import type { FooterBusinessInfo, FooterSettings } from '@/lib/footer-settings'

interface FooterData extends FooterBusinessInfo {
  footer_settings: Partial<FooterSettings> | null
}

export function PublicFooter() {
  const [data, setData] = useState<FooterData | null>(null)

  useEffect(() => {
    let active = true
    async function loadFooter() {
      const { data: settings } = await supabase
        .from('website_settings')
        .select('phone_number,email,address,business_hours,site_name,footer_settings')
        .single()
      if (active && settings) setData(settings as FooterData)
    }
    void loadFooter().catch(error => console.error('No se pudo cargar el footer:', error))
    return () => { active = false }
  }, [])

  return <FooterDesign settings={data?.footer_settings} business={data} />
}
