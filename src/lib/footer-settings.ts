export interface FooterLink { label: string; url: string }

export interface FooterSettings {
  brand_title: string
  description: string
  contact_title: string
  hours_title: string
  copyright_text: string
  show_contact: boolean
  show_phone: boolean
  show_email: boolean
  show_address: boolean
  show_hours: boolean
  heading_font: string
  body_font: string
  heading_weight: string
  body_weight: string
  eyebrow: string
  logo_url: string
  logo_width: number
  logo_width_mobile: number
  show_navigation: boolean
  navigation_title: string
  links: FooterLink[]
  show_cta: boolean
  cta_title: string
  cta_description: string
  cta_label: string
  cta_url: string
  background_color: string
  heading_color: string
  text_color: string
  accent_color: string
  border_color: string
  link_color: string
  link_hover_color: string
  icon_background: string
  cta_background: string
  cta_text_color: string
  button_background: string
  button_text_color: string
  button_hover_background: string
  brand_size: number
  brand_size_mobile: number
  heading_size: number
  body_size: number
  padding_y: number
}

export interface FooterBusinessInfo {
  phone_number?: string | null
  email?: string | null
  address?: string | null
  business_hours?: string | null
  site_name?: string | null
}

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  brand_title: '', description: 'Distribuidora oficial de Sarubbi en Uruguay',
  contact_title: 'Contacto', hours_title: 'Horarios', copyright_text: 'Todos los derechos reservados.',
  show_contact: true, show_phone: true, show_email: true, show_address: true, show_hours: true,
  heading_font: 'lora', body_font: 'dm_sans', heading_weight: '700', body_weight: '400',
  eyebrow: 'Por mayor y menor', logo_url: '', logo_width: 180, logo_width_mobile: 150,
  show_navigation: true, navigation_title: 'Explorá Los Primos',
  links: [{ label: 'Inicio', url: '/' }, { label: 'Catálogo', url: '/catalogo' }],
  show_cta: false, cta_title: 'Todo para tu próxima compra',
  cta_description: 'Explorá el catálogo y armá tu lista de consulta.', cta_label: 'Explorar catálogo', cta_url: '/catalogo',
  background_color: '#292d23', heading_color: '#fffaf0', text_color: '#d6d2c5', accent_color: '#c9b68c',
  border_color: '#505346', link_color: '#eee7d8', link_hover_color: '#e7c988', icon_background: '#393e30',
  cta_background: '#f3eddf', cta_text_color: '#302a20', button_background: '#575b36', button_text_color: '#ffffff', button_hover_background: '#414529',
  brand_size: 36, brand_size_mobile: 30, heading_size: 19, body_size: 14, padding_y: 56
}

export const FOOTER_COLOR_FIELDS = [
  ['background_color', 'Fondo del footer'], ['heading_color', 'Nombre y títulos'],
  ['text_color', 'Textos y derechos'], ['accent_color', 'Detalle e iconos'],
  ['border_color', 'Líneas divisorias'], ['link_color', 'Enlaces'],
  ['link_hover_color', 'Enlaces al pasar el cursor'], ['icon_background', 'Fondo de los iconos'],
  ['cta_background', 'Fondo de la invitación'], ['cta_text_color', 'Texto de la invitación'],
  ['button_background', 'Fondo del botón'], ['button_text_color', 'Texto del botón'],
  ['button_hover_background', 'Botón al pasar el cursor']
] as const

/** Allows local destinations and normal web links in editable footer buttons. */
export function safeFooterLink(value: string): string {
  const link = value.trim()
  if (/^\/(?!\/)/.test(link) && !/[\\\u0000-\u0020]/.test(link)) return link
  try {
    const url = new URL(link)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch { return '' }
}

export function normalizeFooterSettings(input?: Partial<FooterSettings> | null): FooterSettings {
  const settings = { ...DEFAULT_FOOTER_SETTINGS, ...Object.fromEntries(Object.entries(input || {}).filter(([, value]) => value !== null && value !== undefined)) }
  const clamp = (key: keyof FooterSettings, min: number, max: number) => {
    const value = Number(settings[key])
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : Number(DEFAULT_FOOTER_SETTINGS[key])
  }
  settings.logo_width = clamp('logo_width', 60, 360)
  settings.logo_width_mobile = clamp('logo_width_mobile', 60, 300)
  settings.brand_size = clamp('brand_size', 20, 64)
  settings.brand_size_mobile = clamp('brand_size_mobile', 20, 48)
  settings.heading_size = clamp('heading_size', 14, 32)
  settings.body_size = clamp('body_size', 12, 22)
  settings.padding_y = clamp('padding_y', 24, 112)
  for (const [key] of FOOTER_COLOR_FIELDS) {
    if (typeof settings[key] !== 'string' || !/^#[\da-f]{6}$/i.test(settings[key])) settings[key] = DEFAULT_FOOTER_SETTINGS[key]
  }
  settings.links = Array.isArray(settings.links) ? settings.links.slice(0, 12).filter(link => link && typeof link.label === 'string' && typeof link.url === 'string') : DEFAULT_FOOTER_SETTINGS.links
  return settings
}
