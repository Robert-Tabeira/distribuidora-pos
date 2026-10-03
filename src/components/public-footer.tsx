'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Icon } from '@/components/ui/icon'

interface FooterSettings {
  brand_title?: string
  description?: string
  contact_title?: string
  hours_title?: string
  copyright_text?: string
  show_contact?: boolean
  show_phone?: boolean
  show_email?: boolean
  show_address?: boolean
  show_hours?: boolean
}

interface FooterData {
  phone_number: string | null
  email: string | null
  address: string | null
  business_hours: string | null
  site_name: string | null
  footer_settings: FooterSettings | null
}

const DEFAULT_FOOTER: Required<FooterSettings> = {
  brand_title: '',
  description: 'Distribuidora oficial de Sarubbi en Uruguay',
  contact_title: 'Contacto',
  hours_title: 'Horarios',
  copyright_text: 'Todos los derechos reservados.',
  show_contact: true,
  show_phone: true,
  show_email: true,
  show_address: true,
  show_hours: true
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
    void loadFooter()
    return () => { active = false }
  }, [])

  const footer = { ...DEFAULT_FOOTER, ...(data?.footer_settings || {}) }
  const name = footer.brand_title || data?.site_name || 'Los Primos'
  const phone = data?.phone_number?.trim()
  const phoneLink = phone?.replace(/\D/g, '')
  const showContact = footer.show_contact && (
    (footer.show_phone && phone) ||
    (footer.show_email && data?.email) ||
    (footer.show_address && data?.address)
  )
  const showHours = footer.show_hours && data?.business_hours

  return (
    <footer className="bg-gray-900 px-4 py-12 text-gray-300">
      <div className="mx-auto max-w-7xl">
        <div className={`grid grid-cols-1 gap-8 pb-8 ${showContact && showHours ? 'md:grid-cols-3' : showContact || showHours ? 'md:grid-cols-2' : ''}`}>
          <div>
            <h2 className="mb-2 text-2xl font-black text-white">{name}</h2>
            {footer.description && <p className="max-w-sm text-sm leading-6">{footer.description}</p>}
          </div>

          {showContact && <div>
            <h3 className="mb-4 font-bold text-white">{footer.contact_title}</h3>
            <ul className="space-y-3 text-sm">
              {footer.show_phone && phone && <li><a href={`https://wa.me/${phoneLink}`} target="_blank" rel="noreferrer" className="inline-flex items-start gap-2 transition hover:text-white"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0" /><span>WhatsApp: {phone}</span></a></li>}
              {footer.show_email && data?.email && <li><a href={`mailto:${data.email}`} className="inline-flex items-start gap-2 transition hover:text-white"><Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0" /><span>{data.email}</span></a></li>}
              {footer.show_address && data?.address && <li><span className="inline-flex items-start gap-2"><Icon name="location" className="mt-0.5 h-4 w-4 shrink-0" /><span>{data.address}</span></span></li>}
            </ul>
          </div>}

          {showHours && <div>
            <h3 className="mb-4 font-bold text-white">{footer.hours_title}</h3>
            <p className="whitespace-pre-line text-sm leading-6">{data?.business_hours}</p>
          </div>}
        </div>
        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          <p>© {new Date().getFullYear()} {name}{footer.copyright_text ? `. ${footer.copyright_text}` : ''}</p>
        </div>
      </div>
    </footer>
  )
}
