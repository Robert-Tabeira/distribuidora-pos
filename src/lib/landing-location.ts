export interface LandingLocationSettings {
  map_address?: string
  map_display_address?: string
  map_link_text?: string
  map_link_url?: string
  map_embed_url?: string
  map_eyebrow?: string
  map_card_title?: string
  map_card_description?: string
  map_show_hours?: boolean
  map_hours_text?: string
  map_show_phone?: boolean
  map_phone_text?: string
  map_side?: 'left' | 'right'
  map_mobile_order?: 'first' | 'last'
  map_height_mobile?: number
  map_height_tablet?: number
  map_height_desktop?: number
  map_title_size_mobile?: number
  map_title_size_desktop?: number
  map_text_size?: number
  map_section_bg?: string
  map_card_bg?: string
  map_border_color?: string
  map_heading_color?: string
  map_text_color?: string
  map_accent_color?: string
  map_icon_bg?: string
  map_icon_color?: string
  map_button_bg?: string
  map_button_color?: string
}

export const DEFAULT_LOCATION_SETTINGS = {
  map_address: '67P2+8WC Los Primos, Ruta Interbalnearia Gral. Líber Seregni, 15200 Las Toscas, Departamento de Canelones',
  map_display_address: '',
  map_link_text: 'Cómo llegar',
  map_link_url: '',
  map_embed_url: '',
  map_eyebrow: 'Te esperamos en el local',
  map_card_title: 'Pasá por Los Primos',
  map_card_description: '',
  map_show_hours: true,
  map_hours_text: '',
  map_show_phone: true,
  map_phone_text: '',
  map_side: 'right',
  map_mobile_order: 'last',
  map_height_mobile: 300,
  map_height_tablet: 360,
  map_height_desktop: 440,
  map_title_size_mobile: 36,
  map_title_size_desktop: 52,
  map_text_size: 16,
  map_section_bg: '#f6f0e5',
  map_card_bg: '#fffdf8',
  map_border_color: '#e3d7c4',
  map_heading_color: '#2e241a',
  map_text_color: '#645a4a',
  map_accent_color: '#65643e',
  map_icon_bg: '#eeeadc',
  map_icon_color: '#68663e',
  map_button_bg: '#555738',
  map_button_color: '#fffdf6',
} satisfies Required<LandingLocationSettings>

export interface LocationBusinessInfo {
  address?: string | null
  business_hours?: string | null
  phone_number?: string | null
}

export function safeLocationLink(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

// Accept a Google Maps embed URL or its copied iframe, never the HTML itself.
export function googleMapsEmbedSource(value: string) {
  const input = value.trim()
  const iframeSrc = /<iframe\b/i.test(input) ? input.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] : input
  if (!iframeSrc) return null
  try {
    const url = new URL(iframeSrc.replace(/&amp;/g, '&'))
    const googleHost = ['www.google.com', 'maps.google.com', 'google.com'].includes(url.hostname)
    return url.protocol === 'https:' && googleHost && /^\/maps\/embed(?:\/|$)/.test(url.pathname) ? url.href : null
  } catch {
    return null
  }
}

export function locationBlockData(settings: LandingLocationSettings, business?: LocationBusinessInfo | null) {
  const query = settings.map_address?.trim() || DEFAULT_LOCATION_SETTINGS.map_address
  const address = settings.map_display_address?.trim() || (query === DEFAULT_LOCATION_SETTINGS.map_address ? business?.address?.trim() || query : query)
  const encodedAddress = encodeURIComponent(query)
  const mapUrl = safeLocationLink(settings.map_link_url || '') || `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
  const embedUrl = googleMapsEmbedSource(settings.map_embed_url || '') || `https://maps.google.com/maps?q=${encodedAddress}&output=embed`
  const phone = settings.map_phone_text?.trim() || business?.phone_number?.trim() || ''
  const phoneDigits = phone.replace(/\D/g, '')
  return {
    query,
    address,
    mapUrl,
    embedUrl,
    hours: settings.map_show_hours !== false ? settings.map_hours_text?.trim() || business?.business_hours?.trim() || '' : '',
    phone: settings.map_show_phone !== false ? phone : '',
    phoneUrl: phoneDigits.length >= 7 ? `https://wa.me/${phoneDigits}` : '',
  }
}

export function locationNumber(value: number | undefined, fallback: number, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
}
