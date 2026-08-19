'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface WebsiteSettings {
  phone_number: string | null
  email: string | null
  address: string | null
  business_hours: string | null
  show_phone: boolean
  show_email: boolean
  show_address: boolean
  show_business_hours: boolean
  site_name: string
  site_tagline: string
  logo_url: string | null
  use_logo_image: boolean
  logo_link_url: string
}

interface MenuLink {
  id: string
  label: string
  url: string
  order_position: number
  is_active: boolean
}

interface HeaderSettings {
  bg_color: string
  text_color: string
  active_color: string
  sticky: boolean
  shadow: boolean
}

const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  bg_color: '#ffffff',
  text_color: '#374151',
  active_color: '#2563eb',
  sticky: true,
  shadow: true
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [settings, setSettings] = useState<WebsiteSettings | null>(null)
  const [menuLinks, setMenuLinks] = useState<MenuLink[]>([])
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(DEFAULT_HEADER_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function loadData() {
    try {
      const [settingsRes, menuRes, headerRes] = await Promise.all([
        supabase.from('website_settings').select('*').single(),
        supabase.from('menu_links').select('*').eq('is_active', true).order('order_position'),
        supabase.from('header_settings').select('*').single()
      ])

      if (settingsRes.data) setSettings(settingsRes.data as WebsiteSettings)
      if (menuRes.data) setMenuLinks(menuRes.data as MenuLink[])
      if (headerRes.data) setHeaderSettings(headerRes.data as HeaderSettings)
    } catch (error) {
      console.error('Error loading header data:', error)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (path: string) => pathname === path || (path === '/' && pathname === '/landing')

  const siteName = settings?.site_name || 'Los Primos'
  const siteTagline = settings?.site_tagline || 'Distribuidora Oficial Sarubbi'

  return (
    <header
      className={`${headerSettings.sticky ? 'sticky top-0' : ''} z-40 backdrop-blur-md border-b border-gray-200 transition-all duration-300 ${
        headerSettings.shadow ? 'shadow-sm' : ''
      } ${isScrolled ? 'py-2' : 'py-4'}`}
      style={{ backgroundColor: headerSettings.bg_color }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={settings?.logo_link_url || '/landing'} className="flex items-center gap-3 min-w-0">
            {settings?.use_logo_image && settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={siteName}
                className={`object-contain transition-all duration-300 ${isScrolled ? 'h-8' : 'h-10'}`}
              />
            ) : (
              <div className="flex flex-col min-w-0">
                <h1
                  className={`font-black transition-all duration-300 truncate ${isScrolled ? 'text-lg' : 'text-2xl'}`}
                  style={{ color: headerSettings.text_color }}
                >
                  {siteName}
                </h1>
                <p
                  className={`font-semibold transition-all duration-300 truncate ${isScrolled ? 'text-[10px]' : 'text-xs'}`}
                  style={{ color: headerSettings.text_color, opacity: 0.7 }}
                >
                  {siteTagline}
                </p>
              </div>
            )}
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex gap-8">
            {menuLinks.map(link => (
              <Link
                key={link.id}
                href={link.url}
                className="font-semibold transition-all hover:opacity-70"
                style={{ color: isActive(link.url) ? headerSettings.active_color : headerSettings.text_color }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Business Info Button */}
            <div className="relative">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-semibold transition-all md:w-auto text-xs md:text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden md:inline">Info</span>
              </button>

              {/* Dropdown Info */}
              {showInfo && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-6 z-50">
                  <h3 className="font-bold text-gray-900 mb-4">Datos del Negocio</h3>

                  <div className="space-y-4">
                    {settings?.show_phone && settings?.phone_number && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-600">Teléfono</p>
                          <a href={`https://wa.me/${settings.phone_number.replace(/\D/g, '')}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-all">
                            {settings.phone_number}
                          </a>
                        </div>
                      </div>
                    )}

                    {settings?.show_business_hours && settings?.business_hours && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-600">Horarios</p>
                          <p className="font-semibold text-gray-900">{settings.business_hours}</p>
                        </div>
                      </div>
                    )}

                    {settings?.show_address && settings?.address && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-600">Dirección</p>
                          <a href={`https://www.google.com/maps/place/Los+Primos/@-34.7641828,-55.7477291,758m/data=!3m2!1e3!4b1!4m6!3m5!1s0x959ff53fa68babfb:0xaa210ac7416011d2!8m2!3d-34.7641828!4d-55.7477291!16s%2Fg%2F11f06n4mrp?entry=ttu&g_ep=EgoyMDI2MDgwNS4xIKXMDSoASAFQAw%3D%3D${settings.address.replace(/\D/g, '')}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-all">
                            {settings.address}
                          </a>
                        </div>
                      </div>
                    )}

                    {settings?.show_email && settings?.email && (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <a href={`mailto:${settings.email}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-all">
                            {settings.email}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {!settings?.phone_number && !settings?.address && !settings?.business_hours && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay datos de negocio configurados
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Menú hamburguesa - Mobile */}
            {menuLinks.length > 0 && (
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: headerSettings.text_color }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Nav Links - Mobile */}
        {showMobileMenu && menuLinks.length > 0 && (
          <nav className="md:hidden flex flex-col gap-1 pt-4 pb-2 border-t border-gray-100 mt-3">
            {menuLinks.map(link => (
              <Link
                key={link.id}
                href={link.url}
                onClick={() => setShowMobileMenu(false)}
                className="font-semibold py-2 transition-all"
                style={{ color: isActive(link.url) ? headerSettings.active_color : headerSettings.text_color }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
