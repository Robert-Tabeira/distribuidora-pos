'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { getSiteFontFamily } from '@/lib/site-fonts'
import { Icon, type IconName } from '@/components/ui/icon'

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
  logo_transparent_url: string | null
  logo_width: number
  logo_sticky_width: number
  use_logo_image: boolean
  logo_link_url: string
  customer_orders_enabled?: boolean
}

interface MenuLink {
  id: string
  label: string
  url: string
  order_position: number
  is_active: boolean
  icon?: string | null
}

interface HeaderSettings {
  bg_color: string
  text_color: string
  active_color: string
  sticky: boolean
  shadow: boolean
  nav_uppercase: boolean
  nav_underline: boolean
  nav_letter_spacing: 'normal' | 'wide' | 'wider'
  nav_font_weight: string
  font_family?: string
  brand_font_weight?: number
  nav_text_color?: string
  nav_active_color?: string
  nav_transparent_text_color?: string
  nav_transparent_active_color?: string
  nav_font_family?: string
  nav_show_icons?: boolean
  info_button_label?: string
  info_button_icon?: string
  info_button_bg?: string
  info_button_text?: string
  info_panel_bg?: string
  info_panel_border?: string
  info_title?: string
  info_title_color?: string
  info_label_color?: string
  info_value_color?: string
  info_icon_color?: string
  info_hover_color?: string
  info_font_family?: string
  info_font_weight?: string
  info_title_font_weight?: string
  info_phone_icon?: string
  info_hours_icon?: string
  info_address_icon?: string
  info_email_icon?: string
}

const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  bg_color: '#ffffff',
  text_color: '#374151',
  active_color: '#2563eb',
  sticky: true,
  shadow: true,
  nav_uppercase: true,
  nav_underline: true,
  nav_letter_spacing: 'wide',
  nav_font_weight: '700',
  font_family: 'dm_sans',
  brand_font_weight: 900,
  nav_text_color: '#374151',
  nav_active_color: '#2563eb',
  nav_transparent_text_color: '#ffffff',
  nav_transparent_active_color: '#ffffff',
  nav_font_family: 'dm_sans',
  nav_show_icons: false,
  info_button_label: 'Info',
  info_button_icon: 'info',
  info_button_bg: '#eff6ff',
  info_button_text: '#1d4ed8',
  info_panel_bg: '#ffffff',
  info_panel_border: '#e5e7eb',
  info_title: 'Datos del Negocio',
  info_title_color: '#111827',
  info_label_color: '#6b7280',
  info_value_color: '#111827',
  info_icon_color: '#2563eb',
  info_hover_color: '#1d4ed8',
  info_font_family: 'dm_sans',
  info_font_weight: '400',
  info_title_font_weight: '700',
  info_phone_icon: 'phone',
  info_hours_icon: 'clock',
  info_address_icon: 'location',
  info_email_icon: 'mail',
}

const LETTER_SPACING_MAP: Record<string, string> = { normal: 'normal', wide: '0.025em', wider: '0.05em' }
const HEADER_ICON_NAMES: IconName[] = ['home', 'grid', 'store', 'box', 'tag', 'cart', 'phone', 'clock', 'location', 'mail', 'info', 'link', 'users', 'document', 'chat', 'search', 'sparkles']
const defaultMenuIcon = (url: string): IconName => url === '/' || url === '/landing' ? 'home' : url.includes('catalogo') ? 'grid' : 'link'
const safeIconName = (value: string | null | undefined, fallback: IconName): IconName => HEADER_ICON_NAMES.includes(value as IconName) ? value as IconName : fallback

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

  const hasBusinessInfo = Boolean(
    (settings?.show_phone && settings?.phone_number) ||
    (settings?.show_business_hours && settings?.business_hours) ||
    (settings?.show_address && settings?.address) ||
    (settings?.show_email && settings?.email)
  )

  const siteName = settings?.site_name || 'Los Primos'
  const siteTagline = settings?.site_tagline || 'Distribuidora Oficial Sarubbi'
  const visibleMenuLinks = menuLinks.filter(link => settings?.customer_orders_enabled === true || !/^\/cliente(?:\/|$)/.test(link.url))
  const isLandingPage = pathname === '/landing' || pathname === '/'
  const isCatalogPage = pathname === '/catalogo' || pathname.startsWith('/catalogo/')
  const landingHeaderAtTop = isLandingPage && !isScrolled
  const transparentLandingHeader = landingHeaderAtTop && headerSettings.bg_color === 'transparent'
  const transparentHeaderAtTop = landingHeaderAtTop
  const activeLogoUrl = transparentHeaderAtTop
    ? settings?.logo_transparent_url || settings?.logo_url
    : settings?.logo_url
  const activeLogoWidth = !transparentHeaderAtTop && isScrolled
    ? settings?.logo_sticky_width || 144
    : settings?.logo_width || 180
  const headerTextColor = landingHeaderAtTop ? '#ffffff' : headerSettings.text_color
  const navTextColor = landingHeaderAtTop ? headerSettings.nav_transparent_text_color || '#ffffff' : headerSettings.nav_text_color || headerSettings.text_color
  const navActiveColor = landingHeaderAtTop ? headerSettings.nav_transparent_active_color || '#ffffff' : headerSettings.nav_active_color || headerSettings.active_color
  const navFontFamily = getSiteFontFamily(headerSettings.nav_font_family || headerSettings.font_family)
  const infoFontFamily = getSiteFontFamily(headerSettings.info_font_family || 'dm_sans')
  const infoRowStyle = { fontFamily: infoFontFamily, fontWeight: headerSettings.info_font_weight || '400' }
  const infoIconStyle = { color: headerSettings.info_icon_color || '#2563eb' }
  const infoLabelStyle = { color: headerSettings.info_label_color || '#6b7280' }
  const infoValueStyle = { color: headerSettings.info_value_color || '#111827' }
  const infoItems: { key: string; label: string; value: string; icon: IconName; href?: string }[] = []
  if (settings?.show_phone && settings.phone_number) infoItems.push({ key: 'phone', label: 'Teléfono', value: settings.phone_number, icon: safeIconName(headerSettings.info_phone_icon, 'phone'), href: `https://wa.me/${settings.phone_number.replace(/\D/g, '')}` })
  if (settings?.show_business_hours && settings.business_hours) infoItems.push({ key: 'hours', label: 'Horarios', value: settings.business_hours, icon: safeIconName(headerSettings.info_hours_icon, 'clock') })
  if (settings?.show_address && settings.address) infoItems.push({ key: 'address', label: 'Dirección', value: settings.address, icon: safeIconName(headerSettings.info_address_icon, 'location'), href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}` })
  if (settings?.show_email && settings.email) infoItems.push({ key: 'email', label: 'Email', value: settings.email, icon: safeIconName(headerSettings.info_email_icon, 'mail'), href: `mailto:${settings.email}` })
  const renderInfoContent = (mobile = false) => (
    <div className={mobile ? 'space-y-4' : ''} style={infoRowStyle}>
      <h3 className={mobile ? 'mb-4 text-sm' : 'mb-4'} style={{ color: headerSettings.info_title_color || '#111827', fontWeight: headerSettings.info_title_font_weight || '700' }}>{headerSettings.info_title || 'Datos del Negocio'}</h3>
      {infoItems.length > 0 ? <div className="space-y-4">
        {infoItems.map(item => <div key={item.key} className="flex items-start gap-3">
          <Icon name={item.icon} className="mt-0.5 h-5 w-5 flex-shrink-0" style={infoIconStyle} />
          <div className="min-w-0">
            <p className={mobile ? 'text-xs' : 'text-sm'} style={infoLabelStyle}>{item.label}</p>
            {item.href ? <a href={item.href} className="font-semibold transition-colors hover:underline hover:text-[var(--info-hover-color)]" style={{ ...infoValueStyle, '--info-hover-color': headerSettings.info_hover_color || '#1d4ed8' } as React.CSSProperties}>{item.value}</a> : <p className="font-semibold" style={infoValueStyle}>{item.value}</p>}
          </div>
        </div>)}
      </div> : <p className="py-4 text-center text-sm" style={infoLabelStyle}>No hay datos de negocio configurados</p>}
    </div>
  )

  return (
    <header
      className={`${headerSettings.sticky || isLandingPage || isCatalogPage ? 'sticky top-0' : ''} ${isLandingPage ? transparentLandingHeader ? '-mb-16' : isScrolled ? '-mb-14' : '-mb-[72px]' : ''} z-40 ${transparentLandingHeader ? '' : 'backdrop-blur-md'} border-b transition-all duration-300 ${
        landingHeaderAtTop ? 'border-transparent shadow-none' : isLandingPage ? 'border-stone-200 shadow-md' : `border-gray-200 ${headerSettings.shadow ? 'shadow-sm' : ''}`
      } ${isLandingPage ? isScrolled ? 'h-14 py-0' : transparentLandingHeader ? 'h-16 py-0' : 'py-4' : isScrolled ? 'py-2' : 'py-4'}`}
      style={{
        fontFamily: getSiteFontFamily(headerSettings.font_family),
        backgroundColor: landingHeaderAtTop
          ? headerSettings.bg_color === 'transparent' ? 'transparent' : 'rgba(35, 22, 15, 0.16)'
          : isLandingPage || isCatalogPage ? '#ffffff' : headerSettings.bg_color
      }}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 ${isLandingPage && (isScrolled || transparentLandingHeader) ? 'h-full' : ''}`}>
        <div className={`relative flex items-center justify-between ${isLandingPage && (isScrolled || transparentLandingHeader) ? 'h-full' : ''}`}>
          {/* Logo */}
          <Link href={settings?.logo_link_url || '/landing'} className="absolute left-1/2 z-10 flex max-w-[calc(100vw-7rem)] -translate-x-1/2 items-center justify-center gap-3 lg:static lg:max-w-none lg:translate-x-0">
            {settings?.use_logo_image && activeLogoUrl ? (
              <img
                key={activeLogoUrl}
                src={activeLogoUrl}
                alt={siteName}
                className="max-w-full object-contain transition-all duration-300"
                style={{ width: `${activeLogoWidth}px`, maxHeight: isScrolled ? '48px' : '64px', height: 'auto' }}
              />
            ) : (
              <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
                <h1
                  className={`font-black transition-all duration-300 truncate ${isScrolled ? 'text-lg' : 'text-2xl'}`}
                  style={{ color: headerTextColor, fontWeight: headerSettings.brand_font_weight || 900 }}
                >
                  {siteName}
                </h1>
                <p
                  className={`font-semibold transition-all duration-300 truncate ${isScrolled ? 'text-[10px]' : 'text-xs'}`}
                  style={{ color: headerTextColor, opacity: landingHeaderAtTop ? 0.9 : 0.7 }}
                >
                  {siteTagline}
                </p>
              </div>
            )}
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden lg:flex gap-7">
            {visibleMenuLinks.map(link => {
              const active = isActive(link.url)
              return (
                <Link
                  key={link.id}
                  href={link.url}
                  className={`relative py-1.5 text-sm transition-opacity hover:opacity-70 ${headerSettings.nav_uppercase ? 'uppercase' : ''}`}
                  style={{
                    color: active ? navActiveColor : navTextColor,
                    letterSpacing: LETTER_SPACING_MAP[headerSettings.nav_letter_spacing],
                    fontWeight: headerSettings.nav_font_weight,
                    fontFamily: navFontFamily
                  }}
                >
                  {headerSettings.nav_show_icons && <Icon name={safeIconName(link.icon, defaultMenuIcon(link.url))} className="mr-1.5 inline-block h-4 w-4 align-[-2px]" />}
                  {link.label}
                  {headerSettings.nav_underline && (
                    <span
                      className="absolute left-0 -bottom-0.5 h-0.5 w-full rounded-full transition-opacity"
                      style={{ backgroundColor: navActiveColor, opacity: active ? 1 : 0 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Business Info Button (desktop) */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm uppercase tracking-wide transition-all hover:opacity-80"
                style={{
                  color: headerSettings.info_button_text || '#1d4ed8',
                  backgroundColor: headerSettings.info_button_bg || '#eff6ff',
                  fontFamily: infoFontFamily,
                  fontWeight: headerSettings.info_font_weight || '700'
                }}
              >
                <Icon name={safeIconName(headerSettings.info_button_icon, 'info')} className="h-5 w-5" />
                <span>{headerSettings.info_button_label || 'Info'}</span>
              </button>

              {/* Dropdown Info */}
              {showInfo && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border p-6 shadow-xl" style={{ backgroundColor: headerSettings.info_panel_bg || '#ffffff', borderColor: headerSettings.info_panel_border || '#e5e7eb', fontFamily: infoFontFamily, fontWeight: headerSettings.info_font_weight || '400' }}>
                  {renderInfoContent()}
                </div>
              )}
            </div>

            {/* Menú hamburguesa - Mobile */}
            {(visibleMenuLinks.length > 0 || hasBusinessInfo) && (
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-all hover:opacity-70"
                style={{ backgroundColor: showMobileMenu ? `${headerTextColor}0d` : 'transparent' }}
              >
                {showMobileMenu ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: headerTextColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: headerTextColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Menú - Mobile: tarjeta con links + info del negocio */}
        {showMobileMenu && (visibleMenuLinks.length > 0 || hasBusinessInfo) && (
          <div className="lg:hidden mt-3 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {visibleMenuLinks.length > 0 && (
              <nav className="p-2">
                {visibleMenuLinks.map(link => {
                  const active = isActive(link.url)
                  return (
                    <Link
                      key={link.id}
                      href={link.url}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${headerSettings.nav_uppercase ? 'uppercase text-sm' : ''}`}
                      style={{
                        color: active ? navActiveColor : navTextColor,
                        backgroundColor: active ? `${navActiveColor}14` : 'transparent',
                        letterSpacing: LETTER_SPACING_MAP[headerSettings.nav_letter_spacing],
                        fontWeight: headerSettings.nav_font_weight,
                        fontFamily: navFontFamily
                      }}
                    >
                      <Icon name={safeIconName(link.icon, defaultMenuIcon(link.url))} className="h-5 w-5 flex-shrink-0" />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            )}

            {hasBusinessInfo && (
              <div className="border-t border-gray-100 p-4" style={{ backgroundColor: headerSettings.info_panel_bg || '#ffffff', color: headerSettings.info_value_color || '#111827' }}>
                {renderInfoContent(true)}
              </div>
            )}

          </div>
        )}
      </div>
    </header>
  )
}
