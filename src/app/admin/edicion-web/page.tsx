'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { uploadImageToSupabase } from '@/lib/image-upload-helper'
import { PopupFrame } from '@/components/popup-frame'
import { CategoryIconImage } from '@/components/category-icon-image'
import { Icon, type IconName } from '@/components/ui/icon'
import { CATEGORY_ICON_OPTIONS, getCategoryIconName, isCategoryIconImage } from '@/lib/category-icons'
import type { Employee } from '@/types/database'
import { getSiteFontFamily, type SiteFont } from '@/lib/site-fonts'
import { LandingLocation } from '@/components/landing-location'
import { FooterDesign } from '@/components/footer-design'
import { FooterEditor } from '@/components/footer-editor'
import { DEFAULT_FOOTER_SETTINGS, FOOTER_COLOR_FIELDS, normalizeFooterSettings, safeFooterLink, type FooterSettings, type FooterBusinessInfo } from '@/lib/footer-settings'
import { DEFAULT_LOCATION_SETTINGS, googleMapsEmbedSource, safeLocationLink, type LandingLocationSettings } from '@/lib/landing-location'
import { CATEGORY_APPEARANCE_DEFAULTS, CATEGORY_APPEARANCE_COLORS, type LandingCategoryAppearance } from '@/lib/landing-category-appearance'
import { ORDER_INSTRUCTIONS_CONTENT } from '@/lib/landing-order-instructions'
import { SAVED_LISTS_INSTRUCTIONS_CONTENT } from '@/lib/landing-saved-lists-instructions'
import { MobileMenuPanel } from '@/components/mobile-menu-panel'
import { headerNavigationColors } from '@/lib/header-navigation'
import { DEFAULT_MOBILE_MENU_SETTINGS, MOBILE_MENU_COLOR_FIELDS, resolveMobileMenuSettings, type MobileMenuSettings } from '@/lib/mobile-menu-settings'

interface ColorSwatch {
  name: string
  hex: string
}

interface WebsiteSettings {
  id: string
  hero_autoplay_seconds?: number
  phone_number: string | null
  email: string | null
  address: string | null
  business_hours: string | null
  show_phone?: boolean
  show_email?: boolean
  show_address?: boolean
  show_business_hours?: boolean
  customer_orders_enabled?: boolean
  show_recent_product_badge?: boolean
  color_palette?: ColorSwatch[]
  site_name?: string
  site_tagline?: string
  logo_url?: string | null
  logo_transparent_url?: string | null
  favicon_url?: string | null
  logo_width?: number
  logo_sticky_width?: number
  use_logo_image?: boolean
  footer_settings?: FooterSettings
  custom_fonts?: SiteFont[]
}

interface MenuLink {
  id: string
  label: string
  url: string
  icon?: IconName | null
  order_position: number
  is_active: boolean
}

interface HeaderSettings {
  id: string
  mobile_menu_settings?: Partial<MobileMenuSettings> | null
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
  info_button_icon?: IconName
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
  info_phone_icon?: IconName
  info_hours_icon?: IconName
  info_address_icon?: IconName
  info_email_icon?: IconName
}

const HEADER_ICON_OPTIONS: { value: IconName; label: string }[] = [
  { value: 'home', label: 'Inicio / Casa' }, { value: 'grid', label: 'Cuadrícula' }, { value: 'store', label: 'Tienda' },
  { value: 'box', label: 'Caja' }, { value: 'tag', label: 'Etiqueta' }, { value: 'cart', label: 'Carrito' },
  { value: 'phone', label: 'Teléfono' }, { value: 'clock', label: 'Horario' }, { value: 'location', label: 'Ubicación' },
  { value: 'mail', label: 'Correo' }, { value: 'info', label: 'Información' }, { value: 'link', label: 'Enlace' },
  { value: 'users', label: 'Personas' }, { value: 'document', label: 'Documento' }, { value: 'chat', label: 'Mensaje' },
  { value: 'search', label: 'Buscar' }, { value: 'sparkles', label: 'Destellos' },
]
const defaultMenuIcon = (url: string): IconName => url === '/' || url === '/landing' ? 'home' : url.includes('catalogo') ? 'grid' : 'link'

interface Popup {
  id: string
  name: string
  is_active: boolean
  content_mode: string
  font_family?: string | null
  font_weight?: number | null
  title: string | null
  message: string | null
  image_url: string | null
  cta_text: string | null
  cta_url: string | null
  bg_color: string
  text_color: string
  button_bg_color: string
  button_text_color: string
  clickable_image_url: string | null
  clickable_image_link: string | null
  trigger_on_load: boolean
  trigger_on_load_delay: number
  trigger_on_scroll: boolean
  trigger_on_scroll_percent: number
  trigger_on_exit: boolean
  show_on_landing: boolean
  show_on_catalogo: boolean
  show_once_per_session: boolean
  order_position: number
  border_style: 'none' | 'solid' | 'dashed' | 'dotted'
  border_width: number
  border_color: string
  border_radius: number
  dash_length: number
  dash_gap: number
  shape: 'rectangular' | 'ticket'
}

interface HeroSlide {
  id: string
  internal_name: string
  cta_bottom_offset?: number | null
  order_position: number
  image_url: string
  mobile_image_url?: string | null
  desktop_text_position?: string | null
  mobile_text_position?: string | null
  desktop_image_position?: string | null
  mobile_image_position?: string | null
  desktop_image_fit?: 'cover' | 'contain' | null
  mobile_image_fit?: 'cover' | 'contain' | null
  title_font?: string | null
  body_font?: string | null
  title_font_weight?: number | null
  body_font_weight?: number | null
  title_size_desktop?: number | null
  title_size_mobile?: number | null
  body_size_desktop?: number | null
  body_size_mobile?: number | null
  image_darkness?: number | null
  show_title_mobile?: boolean | null
  show_title_desktop?: boolean | null
  show_description_mobile?: boolean | null
  show_description_desktop?: boolean | null
  title: string | null
  description: string | null
  cta_text: string | null
  cta_url: string | null
  is_active: boolean
}

interface LandingSection {
  id: string
  section_name: string
  title: string | null
  subtitle: string | null
  description: string | null
  image_url: string | null
  is_visible: boolean
  block_type: LandingBlockType
  order_position: number
  settings: LandingSectionSettings
}

type LandingBlockType = 'content' | 'categories' | 'banner' | 'feature_cards' | 'instructions' | 'order_instructions' | 'saved_lists_instructions' | 'business_info' | 'location_map' | 'image_carousel' | 'product_grid'

interface LandingFeatureCard {
  title: string
  description: string
  image_url: string
  mobile_image_url?: string
  link_url: string
  button_text: string
}

interface LandingCarouselSlide {
  image_url: string
  mobile_image_url?: string
  link_url: string
}

interface LandingInstructionStep {
  title: string
  description: string
  image_url: string
  mobile_image_url?: string
}

interface EditableLandingCategory {
  id: string
  name: string
  parent_id: string | null
  show_in_catalog: boolean
}

interface EditableLandingProduct {
  id: string
  name: string
}

function CategoryDestinationSelect({
  categories,
  value,
  onChange,
}: {
  categories: EditableLandingCategory[]
  value: string
  onChange: (url: string) => void
}) {
  const visibleCategories = categories
    .filter(category => category.show_in_catalog !== false)
    .sort((a, b) => {
      const aParent = a.parent_id ? categories.find(category => category.id === a.parent_id)?.name || '' : ''
      const bParent = b.parent_id ? categories.find(category => category.id === b.parent_id)?.name || '' : ''
      return aParent.localeCompare(bParent, 'es') || a.name.localeCompare(b.name, 'es')
    })
  const selectedCategoryId = visibleCategories.find(category => value === `/catalogo?categoria=${encodeURIComponent(category.id)}`)?.id || ''

  return (
    <label className="block text-xs text-text-muted">
      Ir directamente a una categoría
      <select
        className="input mt-1"
        value={selectedCategoryId}
        onChange={event => onChange(event.target.value ? `/catalogo?categoria=${encodeURIComponent(event.target.value)}` : '')}
      >
        <option value="">Elegir categoría (opcional)</option>
        {visibleCategories.map(category => (
          <option key={category.id} value={category.id}>
            {category.parent_id ? `— ${category.name}` : category.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function ProductDestinationSelect({
  products,
  value,
  onChange,
}: {
  products: EditableLandingProduct[]
  value: string
  onChange: (url: string) => void
}) {
  const selectedProductId = products.find(product => value === `/catalogo?producto=${encodeURIComponent(product.id)}`)?.id || ''
  return (
    <label className="mt-2 block text-xs text-text-muted">
      O abrir un producto específico
      <select
        className="input mt-1"
        value={selectedProductId}
        onChange={event => onChange(event.target.value ? `/catalogo?producto=${encodeURIComponent(event.target.value)}` : '')}
      >
        <option value="">Elegir producto (opcional)</option>
        {products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
      </select>
    </label>
  )
}

interface LandingSectionSettings extends LandingLocationSettings, LandingCategoryAppearance {
  button_text?: string
  button_url?: string
  background_color?: string
  mode?: 'popular' | 'discounts'
  limit?: number
  show_phone?: boolean
  show_email?: boolean
  show_address?: boolean
  show_business_hours?: boolean
  category_icons?: Record<string, string>
  category_order?: string[]
  category_icon_size_desktop?: number
  category_icon_size_mobile?: number
  category_custom_icon_weight?: number
  category_icon_bg_color?: string
  category_icon_color?: string
  category_icon_hover_bg_color?: string
  category_icon_hover_color?: string
  cards?: LandingFeatureCard[]
  instruction_steps?: LandingInstructionStep[]
  instruction_shipping_visible?: boolean
  instruction_shipping_title?: string
  instruction_shipping_text?: string
  instruction_note_title?: string
  instruction_note?: string
  instruction_section_bg?: string
  instruction_eyebrow_color?: string
  instruction_heading_color?: string
  instruction_subtitle_color?: string
  instruction_description_color?: string
  instruction_accent_color?: string
  instruction_card_bg?: string
  instruction_card_border?: string
  instruction_number_bg?: string
  instruction_number_color?: string
  instruction_step_title_color?: string
  instruction_step_text_color?: string
  instruction_image_bg?: string
  instruction_placeholder_color?: string
  instruction_note_bg?: string
  instruction_note_border?: string
  instruction_note_title_color?: string
  instruction_note_text_color?: string
  instruction_note_icon_color?: string
  instruction_button_bg?: string
  instruction_button_color?: string
  slides?: LandingCarouselSlide[]
  mobile_image_url?: string
  desktop_text_alignment?: 'inherit' | 'left' | 'center' | 'right'
  mobile_text_alignment?: 'inherit' | 'left' | 'center' | 'right'
  desktop_image_position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  mobile_image_position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  desktop_image_side?: 'left' | 'right'
  mobile_image_order?: 'first' | 'last'
  heading_font?: string
  body_font?: string
  heading_weight?: string
  body_weight?: string
}

interface AnnouncementMessage {
  id: string
  message: string
  icon: string | null
  link_text: string | null
  link_url: string | null
  order_position: number
  is_active: boolean
}

interface BarSettings {
  id: string
  bg_color: string
  text_color: string
  font_family: string
  font_size: string
  font_weight: string
  letter_spacing: string
  animation: string
}

const DEFAULT_PALETTE: ColorSwatch[] = [
  { name: 'Primario', hex: '#1d4ed8' },
  { name: 'Secundario', hex: '#0891b2' },
  { name: 'Acento', hex: '#f59e0b' },
  { name: 'Oscuro', hex: '#111827' },
  { name: 'Claro', hex: '#ffffff' },
  { name: 'Éxito', hex: '#16a34a' },
  { name: 'Alerta', hex: '#dc2626' }
]

const LANDING_BLOCK_LABELS: Record<LandingBlockType, string> = {
  content: 'Contenido e imagen',
  categories: 'Categorías principales',
  banner: 'Banner con botón',
  feature_cards: 'Tarjetas con imagen',
  instructions: 'Instrucciones en 3 pasos',
  order_instructions: 'Cómo hacer pedidos en 3 pasos',
  saved_lists_instructions: 'Cómo repetir pedidos con listas guardadas',
  business_info: 'Información del local',
  location_map: 'Ubicación en mapa',
  image_carousel: 'Carrusel de imágenes',
  product_grid: 'Productos u ofertas'
}

const BUILT_IN_FONT_OPTIONS = [
  { value: 'dm_sans', label: 'DM Sans' },
  { value: 'fira_sans', label: 'Fira Sans' },
  { value: 'lora', label: 'Lora' },
  { value: 'georgia', label: 'Georgia' },
]
const FONT_WEIGHT_OPTIONS = [
  { value: '300', label: 'Liviano' },
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medio' },
  { value: '600', label: 'Semi-negrita' },
  { value: '700', label: 'Negrita' },
  { value: '800', label: 'Extra-negrita' },
  { value: '900', label: 'Negro' },
]

const LOCATION_COLOR_FIELDS = [
  ['Fondo del bloque', 'map_section_bg'],
  ['Fondo de la tarjeta', 'map_card_bg'],
  ['Bordes', 'map_border_color'],
  ['Títulos', 'map_heading_color'],
  ['Textos y dirección', 'map_text_color'],
  ['Etiquetas y línea decorativa', 'map_accent_color'],
  ['Fondo de iconos y mapa sin cargar', 'map_icon_bg'],
  ['Icono principal', 'map_icon_color'],
  ['Fondo del botón', 'map_button_bg'],
  ['Texto del botón', 'map_button_color'],
] as const

function defaultLandingSettings(type: LandingBlockType): LandingSectionSettings {
  const typography: Pick<LandingSectionSettings, 'heading_font' | 'body_font' | 'heading_weight' | 'body_weight'> = { heading_font: 'lora', body_font: 'dm_sans', heading_weight: '700', body_weight: '400' }
  if (type === 'banner') return { ...typography, button_text: 'Ver catálogo', button_url: '/catalogo', background_color: '#fff7ed' }
  if (type === 'order_instructions') return { ...typography, ...ORDER_INSTRUCTIONS_CONTENT.settings }
  if (type === 'saved_lists_instructions') return { ...typography, ...SAVED_LISTS_INSTRUCTIONS_CONTENT.settings }
  if (type === 'feature_cards') return { cards: [
    { title: '', description: '', image_url: '', link_url: '', button_text: '' },
    { title: '', description: '', image_url: '', link_url: '', button_text: '' }
  ], ...typography }
  if (type === 'instructions') return {
    ...typography,
    instruction_steps: [
      { title: 'Explorá el catálogo', description: 'Buscá los productos que necesitás y agregalos a tu consulta.', image_url: '', mobile_image_url: '' },
      { title: 'Armá tu lista', description: 'Reuní todos los productos que querés consultar en una sola lista.', image_url: '', mobile_image_url: '' },
      { title: 'Enviá por WhatsApp', description: 'Mandanos la consulta y te respondemos con los precios.', image_url: '', mobile_image_url: '' },
    ],
    instruction_note_title: '¿Sos comerciante o comprás para tu hogar?',
    instruction_note: 'No hay mínimos complicados. Consultanos por unidad o por bulto cerrado y te asesoramos al instante.',
    button_text: 'Ir al catálogo y consultar',
    button_url: '/catalogo',
  }
  if (type === 'business_info') return { ...typography, show_phone: true, show_email: true, show_address: true, show_business_hours: true }
  if (type === 'location_map') return { ...typography, ...DEFAULT_LOCATION_SETTINGS }
  if (type === 'categories') return {
    ...typography,
    ...CATEGORY_APPEARANCE_DEFAULTS,
    category_icons: {},
    category_icon_size_desktop: 44,
    category_icon_size_mobile: 44,
    category_custom_icon_weight: 0,
    category_icon_bg_color: '#f2e9e3',
    category_icon_color: '#8b4a2f',
    category_icon_hover_bg_color: '#8b4a2f',
    category_icon_hover_color: '#ffffff',
  }
  if (type === 'image_carousel') return { ...typography, slides: [] }
  if (type === 'product_grid') return { ...typography, mode: 'popular', limit: 5, button_text: 'Ver catálogo', button_url: '/catalogo' }
  return typography
}

// Genera una versión más clara/oscura de un color hex (para previews de degradado)
function shadeColor(hex: string, percent: number) {
  try {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + percent))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent))
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent))
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  } catch {
    return hex
  }
}

// Sección plegable reutilizable, para no mostrar todos los controles
// de diseño a la vista al mismo tiempo (colores, tipografía, efectos, etc.)
function CollapsibleCard({
  icon,
  title,
  subtitle,
  defaultOpen = false,
  children
}: {
  icon: IconName
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="card mb-4 max-w-2xl !p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon name={icon} className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="font-bold text-text">{title}</p>
            {subtitle && <p className="text-xs text-text-muted truncate">{subtitle}</p>}
          </div>
        </div>
        <span className={`text-text-muted transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {open && <div className="px-5 pb-5 pt-1 border-t border-border">{children}</div>}
    </div>
  )
}

// Panel de vista previa del sitio (solo desktop, aprovecha el espacio libre
// a la derecha). Muestra barra de anuncios + header juntos, tal como se ven
// en la web real, reflejando los valores actuales de los formularios.
function SitePreviewPanel({
  sectionView,
  barForm,
  announcements,
  logoForm,
  headerForm,
  headerPreviewMode,
  menuLinks,
  landingSections,
  footerForm,
  footerBusiness,
  editingPopupForm,
  customFonts
}: {
  sectionView: string | null
  headerPreviewMode: 'hero' | 'solid'
  barForm: { bg_color: string; text_color: string; font_family: string; font_size: string; font_weight: string; letter_spacing: string; animation: string }
  announcements: AnnouncementMessage[]
  logoForm: { site_name: string; site_tagline: string; logo_url: string; logo_transparent_url: string; logo_width: number; logo_sticky_width: number; use_logo_image: boolean }
  headerForm: { bg_color: string; text_color: string; active_color: string; sticky: boolean; shadow: boolean; nav_uppercase: boolean; nav_underline: boolean; nav_letter_spacing: string; nav_font_weight: string; font_family?: string; brand_font_weight?: number; nav_text_color?: string; nav_active_color?: string; nav_transparent_text_color?: string; nav_transparent_active_color?: string; nav_font_family?: string; nav_show_icons?: boolean; info_button_label?: string; info_button_icon?: IconName; info_button_bg?: string; info_button_text?: string; info_font_family?: string }
  menuLinks: MenuLink[]
  landingSections: LandingSection[]
  footerForm: FooterSettings
  footerBusiness?: FooterBusinessInfo | null
  editingPopupForm?: any
  customFonts: SiteFont[]
}) {
  const FONT_FAMILY_MAP: Record<string, string> = {
    default: "'DM Sans', sans-serif",
    fira_sans: "'Fira Sans', sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "'Courier New', monospace"
  }
  const LETTER_SPACING_MAP: Record<string, string> = { normal: 'normal', wide: '0.025em', wider: '0.05em' }

  const activeAnnouncement = announcements.filter(a => a.is_active).sort((a, b) => a.order_position - b.order_position)[0]
  const heroPreview = sectionView === 'header' && headerPreviewMode === 'hero'
  const previewNavColors = headerNavigationColors(headerForm, heroPreview)
  const previewLogo = heroPreview ? logoForm.logo_transparent_url || logoForm.logo_url : logoForm.logo_url
  const previewBrandColor = heroPreview ? '#ffffff' : headerForm.text_color
  const isGradient = barForm.animation === 'gradient'
  const sortedLinks = [...menuLinks].sort((a, b) => a.order_position - b.order_position).filter(l => l.is_active)

  const highlight = (zone: 'announcement' | 'header') =>
    sectionView === zone ? 'ring-2 ring-primary ring-offset-2 ring-offset-white' : ''

  return (
    <div>
      <p className="text-xs font-semibold text-text-muted mb-2">VISTA PREVIA DEL SITIO</p>

      <div className="relative rounded-2xl border border-border overflow-hidden shadow-sm bg-white">
        {/* Barra tipo navegador */}
        <div className="bg-gray-100 px-3 py-2 flex items-center gap-1.5 border-b border-border">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <div className="flex-1 mx-2 bg-white rounded px-2 py-0.5 text-[10px] text-text-light truncate">
            losprimos.com
          </div>
        </div>

        {/* Barra de anuncios */}
        {activeAnnouncement && (
          <div
            className={`transition-all py-2 px-3 flex items-center justify-center gap-1.5 text-center ${highlight('announcement')}`}
            style={{
              backgroundImage: isGradient ? `linear-gradient(270deg, ${barForm.bg_color}, ${shadeColor(barForm.bg_color, 45)}, ${barForm.bg_color})` : undefined,
              backgroundColor: isGradient ? undefined : barForm.bg_color,
              color: barForm.text_color,
              fontFamily: getSiteFontFamily(barForm.font_family, customFonts) || FONT_FAMILY_MAP[barForm.font_family],
              fontSize: `calc(${barForm.font_size} * 0.9)`,
              fontWeight: barForm.font_weight,
              letterSpacing: LETTER_SPACING_MAP[barForm.letter_spacing]
            }}
          >
            {activeAnnouncement.icon && <span>{activeAnnouncement.icon}</span>}
            <span className="truncate">{activeAnnouncement.message}</span>
          </div>
        )}

        {/* Header */}
        <div
          className={`px-3 py-2.5 flex items-center justify-between transition-all ${headerForm.shadow ? 'shadow-sm' : ''} ${highlight('header')}`}
          style={{ backgroundColor: heroPreview ? '#30281f' : '#ffffff', fontFamily: getSiteFontFamily(headerForm.font_family, customFonts) }}
        >
          {logoForm.use_logo_image && previewLogo ? (
            <img src={previewLogo} alt={logoForm.site_name} className="h-6 object-contain" style={{ width: `${logoForm.logo_width}px` }} />
          ) : (
            <div className="min-w-0">
              <p className="font-black text-xs truncate" style={{ color: previewBrandColor, fontFamily: getSiteFontFamily(headerForm.font_family, customFonts), fontWeight: headerForm.brand_font_weight }}>{logoForm.site_name}</p>
              <p className="text-[8px] font-semibold truncate" style={{ color: previewBrandColor, opacity: 0.7, fontWeight: headerForm.brand_font_weight }}>{logoForm.site_tagline}</p>
            </div>
          )}
          <div className="flex gap-2.5 flex-shrink-0">
            {sortedLinks.slice(0, 3).map((link, idx) => (
              <span
                key={link.id}
                className={`relative text-[9px] pb-0.5 ${headerForm.nav_uppercase ? 'uppercase' : ''}`}
                style={{
                  color: idx === 0 ? previewNavColors.active : previewNavColors.text,
                  letterSpacing: LETTER_SPACING_MAP[headerForm.nav_letter_spacing],
                  fontWeight: headerForm.nav_font_weight,
                  fontFamily: getSiteFontFamily(headerForm.nav_font_family || headerForm.font_family, customFonts)
                }}
              >
                {headerForm.nav_show_icons && <Icon name={link.icon || defaultMenuIcon(link.url)} className="mr-1 inline h-3 w-3" />}
                {link.label}
                {headerForm.nav_underline && idx === 0 && (
                  <span className="absolute left-0 -bottom-0 h-px w-full" style={{ backgroundColor: previewNavColors.active }} />
                )}
              </span>
            ))}
          </div>
        </div>

        {sectionView === 'footer' ? (
          <div className="max-h-[560px] overflow-auto"><FooterDesign settings={footerForm} business={footerBusiness} preview /></div>
        ) : sectionView === 'landing' ? (
          <div className="max-h-72 space-y-2 overflow-auto bg-gray-50 p-3">
            {landingSections.filter(section => section.is_visible).length > 0 ? landingSections.filter(section => section.is_visible).map(section => (
              <div key={section.id} className="flex min-h-16 items-center gap-2 rounded-lg border border-gray-100 bg-white p-2">
                {section.image_url && <img src={section.image_url} alt="" className="h-12 w-14 rounded object-cover" />}
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-gray-800">{section.title || section.section_name}</p>
                  {section.subtitle && <p className="truncate text-[10px] text-primary">{section.subtitle}</p>}
                  {section.description && <p className="line-clamp-1 text-[9px] text-gray-500">{section.description}</p>}
                </div>
              </div>
            )) : <p className="py-8 text-center text-xs text-gray-500">Los bloques visibles aparecerán aquí</p>}
          </div>
        ) : (
          /* Placeholder del resto de la página */
          <div className="bg-gray-50 p-4 space-y-2">
            <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          </div>
        )}

        {/* Overlay: pop-up en construcción */}
        {editingPopupForm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6">
            {editingPopupForm.content_mode === 'image' ? (
              <div className="relative w-36">
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center text-[9px] font-bold text-gray-700 z-20">✕</div>
                <PopupFrame frame={editingPopupForm} className="overflow-hidden">
                  {editingPopupForm.clickable_image_url ? (
                    <img src={editingPopupForm.clickable_image_url} alt="" className="w-full h-auto block" />
                  ) : (
                    <div className="w-full h-20 bg-gray-200 flex items-center justify-center text-[9px] text-gray-400 text-center px-2">
                      Subí una imagen
                    </div>
                  )}
                </PopupFrame>
              </div>
            ) : (
              <PopupFrame frame={editingPopupForm} backgroundColor={editingPopupForm.bg_color} className="p-4 text-center shadow-xl w-48 relative">
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold z-20" style={{ color: editingPopupForm.text_color }}>✕</div>
                <div style={{ color: editingPopupForm.text_color }}>
                  {editingPopupForm.image_url && <img src={editingPopupForm.image_url} alt="" className="w-full h-auto rounded mb-2" />}
                  {editingPopupForm.title && <p className="font-black text-xs mb-1 leading-tight">{editingPopupForm.title}</p>}
                  {editingPopupForm.message && <p className="text-[9px] opacity-90 mb-2 leading-snug">{editingPopupForm.message}</p>}
                  {editingPopupForm.cta_text && (
                    <span
                      className="inline-block px-2.5 py-1 rounded text-[9px] font-bold"
                      style={{ backgroundColor: editingPopupForm.button_bg_color, color: editingPopupForm.button_text_color }}
                    >
                      {editingPopupForm.cta_text}
                    </span>
                  )}
                  {!editingPopupForm.title && !editingPopupForm.message && (
                    <p className="text-[9px] opacity-60 italic">Completá el contenido a la izquierda</p>
                  )}
                </div>
              </PopupFrame>
            )}
          </div>
        )}
      </div>

      {sectionView === 'hero' && (
        <p className="text-xs text-text-light mt-3 text-center">
          Esta sección todavía no tiene vista previa propia — arriba se ve el resto del sitio (barra + header) mientras tanto.
        </p>
      )}
    </div>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
  palette
}: {
  label: string
  value: string
  onChange: (hex: string) => void
  palette: ColorSwatch[]
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-text-muted mb-2">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        {palette.map((swatch) => (
          <button
            key={swatch.hex}
            type="button"
            title={swatch.name}
            onClick={() => onChange(swatch.hex)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              value.toLowerCase() === swatch.hex.toLowerCase()
                ? 'border-primary scale-110 shadow-md'
                : 'border-white shadow'
            }`}
            style={{ backgroundColor: swatch.hex }}
          />
        ))}

        {/* Custom */}
        <div className="relative w-8 h-8">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Color personalizado"
          />
          <div
            className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xs pointer-events-none"
            style={{ backgroundColor: !palette.some(s => s.hex.toLowerCase() === value.toLowerCase()) ? value : undefined }}
          >
            {palette.some(s => s.hex.toLowerCase() === value.toLowerCase()) && <Icon name="palette" className="h-4 w-4" />}
          </div>
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input !w-28 !py-1.5 text-xs font-mono"
        />
      </div>
    </div>
  )
}

export default function WebsiteEditionPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mobileHeroInputRef = useRef<HTMLInputElement>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'settings' | 'sections'>('settings')
  const [sectionView, setSectionView] = useState<'announcement' | 'header' | 'hero' | 'landing' | 'popups' | 'footer' | 'fonts'>('announcement')
  const [headerPreviewMode, setHeaderPreviewMode] = useState<'hero' | 'solid'>('solid')

  // Settings
  const [settings, setSettings] = useState<WebsiteSettings | null>(null)
  const [settingsForm, setSettingsForm] = useState({ 
    phone_number: '', 
    email: '', 
    address: '', 
    business_hours: '',
    show_phone: true,
    show_email: true,
    show_address: true,
    show_business_hours: true,
    customer_orders_enabled: false,
    show_recent_product_badge: true
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [footerForm, setFooterForm] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS)
  const [savingFooter, setSavingFooter] = useState(false)
  const [footerMessage, setFooterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [customFonts, setCustomFonts] = useState<SiteFont[]>([])
  const [fontFile, setFontFile] = useState<File | null>(null)
  const [fontName, setFontName] = useState('')
  const [uploadingFont, setUploadingFont] = useState(false)

  // Hero Slides
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [editingHero, setEditingHero] = useState<HeroSlide | null>(null)
  const [heroForm, setHeroForm] = useState({ internal_name: '', title: '', description: '', cta_text: '', cta_url: '', cta_bottom_offset: null as number | null, show_title_mobile: true, show_title_desktop: true, show_description_mobile: true, show_description_desktop: true, image_url: '', mobile_image_url: '', desktop_text_position: 'left', mobile_text_position: 'left', desktop_image_position: 'center', mobile_image_position: 'center', desktop_image_fit: 'contain' as 'cover' | 'contain', mobile_image_fit: 'contain' as 'cover' | 'contain', image_darkness: 18, title_font: 'lora', body_font: 'dm_sans', title_font_weight: 900, body_font_weight: 400, title_size_desktop: 72, title_size_mobile: 48, body_size_desktop: 24, body_size_mobile: 20 })
  const [savingHero, setSavingHero] = useState(false)
  const [heroAutoplaySeconds, setHeroAutoplaySeconds] = useState(5)
  const [savingHeroAutoplay, setSavingHeroAutoplay] = useState(false)
  const [heroAutoplayMessage, setHeroAutoplayMessage] = useState<string | null>(null)
  const [showHeroModal, setShowHeroModal] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState('')
  const [mobileHeroPreview, setMobileHeroPreview] = useState('')

  // Landing Sections
  const [sections, setSections] = useState<LandingSection[]>([])
  const [landingCategories, setLandingCategories] = useState<EditableLandingCategory[]>([])
  const [landingProducts, setLandingProducts] = useState<EditableLandingProduct[]>([])
  const [editingSection, setEditingSection] = useState<LandingSection | null>(null)
  const [sectionForm, setSectionForm] = useState({ section_name: '', title: '', subtitle: '', description: '', image_url: '', is_visible: true, block_type: 'content' as LandingBlockType, settings: {} as LandingSectionSettings })
  const [savingSection, setSavingSection] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)

  // Announcement Bar
  const [announcements, setAnnouncements] = useState<AnnouncementMessage[]>([])
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementMessage | null>(null)
  const [announcementForm, setAnnouncementForm] = useState({ message: '', icon: '', link_text: '', link_url: '', is_active: true })
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)

  // Paleta de colores global
  const [palette, setPalette] = useState<ColorSwatch[]>(DEFAULT_PALETTE)
  const [savingPalette, setSavingPalette] = useState(false)

  // Diseño de la barra de anuncios
  const [barSettings, setBarSettings] = useState<BarSettings | null>(null)
  const [barForm, setBarForm] = useState({
    bg_color: '#111827',
    text_color: '#ffffff',
    font_family: 'default',
    font_size: '14px',
    font_weight: '500',
    letter_spacing: 'normal',
    animation: 'none'
  })
  const [savingBarSettings, setSavingBarSettings] = useState(false)

  // Header: Logo y Nombre
  const [logoForm, setLogoForm] = useState({
    site_name: 'Los Primos',
    site_tagline: 'Distribuidora Oficial Sarubbi',
    logo_url: '',
    logo_transparent_url: '',
    favicon_url: '',
    logo_width: 180,
    logo_sticky_width: 144,
    use_logo_image: false,
    logo_link_url: '/landing'
  })
  const [savingLogo, setSavingLogo] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Header: Enlaces de Menú
  const [menuLinks, setMenuLinks] = useState<MenuLink[]>([])
  const [editingMenuLink, setEditingMenuLink] = useState<MenuLink | null>(null)
  const [menuLinkForm, setMenuLinkForm] = useState<{ label: string; url: string; is_active: boolean; icon: IconName }>({ label: '', url: '', is_active: true, icon: 'link' })
  const [savingMenuLink, setSavingMenuLink] = useState(false)
  const [showMenuLinkModal, setShowMenuLinkModal] = useState(false)

  // Header: Estilo
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings | null>(null)
  const [headerForm, setHeaderForm] = useState({
    bg_color: '#ffffff',
    text_color: '#374151',
    active_color: '#2563eb',
    sticky: true,
    shadow: true,
    nav_uppercase: true,
    nav_underline: true,
    nav_letter_spacing: 'wide' as 'normal' | 'wide' | 'wider',
    nav_font_weight: '700',
    font_family: 'dm_sans',
    brand_font_weight: 900,
    nav_text_color: '#374151',
    nav_active_color: '#2563eb',
    nav_transparent_text_color: '#ffffff',
    nav_transparent_active_color: '#ffffff',
    nav_font_family: 'dm_sans',
    nav_show_icons: false,
    mobile_menu_settings: { ...DEFAULT_MOBILE_MENU_SETTINGS },
    info_button_label: 'Info',
    info_button_icon: 'info' as IconName,
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
    info_phone_icon: 'phone' as IconName,
    info_hours_icon: 'clock' as IconName,
    info_address_icon: 'location' as IconName,
    info_email_icon: 'mail' as IconName,
  })
  const [savingHeaderSettings, setSavingHeaderSettings] = useState(false)

  // Pop-ups
  const [popups, setPopups] = useState<Popup[]>([])
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null)
  const [showPopupModal, setShowPopupModal] = useState(false)
  const [savingPopup, setSavingPopup] = useState(false)
  const [uploadingPopupImage, setUploadingPopupImage] = useState(false)
  const [uploadingClickableImage, setUploadingClickableImage] = useState(false)
  const [popupForm, setPopupForm] = useState({
    name: '',
    is_active: true,
    content_mode: 'builder',
    font_family: 'dm_sans',
    font_weight: 400,
    title: '',
    message: '',
    image_url: '',
    cta_text: '',
    cta_url: '',
    bg_color: '#ffffff',
    text_color: '#111827',
    button_bg_color: '#2563eb',
    button_text_color: '#ffffff',
    clickable_image_url: '',
    clickable_image_link: '',
    trigger_on_load: true,
    trigger_on_load_delay: 3,
    trigger_on_scroll: false,
    trigger_on_scroll_percent: 50,
    trigger_on_exit: false,
    show_on_landing: true,
    show_on_catalogo: true,
    show_once_per_session: true,
    border_style: 'none' as 'none' | 'solid' | 'dashed' | 'dotted',
    border_width: 2,
    border_color: '#111827',
    border_radius: 16,
    dash_length: 8,
    dash_gap: 6,
    shape: 'rectangular' as 'rectangular' | 'ticket'
  })

  useEffect(() => {
    const stored = localStorage.getItem('employee')
    if (!stored) {
      router.push('/login')
      return
    }
    const emp = JSON.parse(stored)
    if (emp.role !== 'admin') {
      router.push('/mostrador')
      return
    }
    setEmployee(emp)
    loadData()
  }, [router])

  async function loadData() {
    try {
      const [settingsRes, heroRes, sectionsRes, announcementsRes, barSettingsRes, menuLinksRes, headerSettingsRes, popupsRes, categoriesRes, productsRes] = await Promise.all([
        supabase.from('website_settings').select('*').single(),
        supabase.from('hero_slides').select('*').order('order_position'),
        supabase.from('landing_sections').select('*').order('order_position').order('section_name'),
        supabase.from('announcement_messages').select('*').order('order_position'),
        supabase.from('announcement_bar_settings').select('*').single(),
        supabase.from('menu_links').select('*').order('order_position'),
        supabase.from('header_settings').select('*').single(),
        supabase.from('popups').select('*').order('order_position'),
        supabase.from('categories').select('*').order('order_position'),
        supabase.from('products').select('id,name').eq('status', 'complete').eq('visible_in_catalog', true).order('name')
      ])

      if (settingsRes.data) {
        setSettings(settingsRes.data as WebsiteSettings)
        setCustomFonts(Array.isArray(settingsRes.data.custom_fonts) ? settingsRes.data.custom_fonts as SiteFont[] : [])
        setHeroAutoplaySeconds(settingsRes.data.hero_autoplay_seconds ?? 5)
        setFooterForm(normalizeFooterSettings(settingsRes.data.footer_settings))
        setSettingsForm({
          phone_number: settingsRes.data.phone_number || '',
          email: settingsRes.data.email || '',
          address: settingsRes.data.address || '',
          business_hours: settingsRes.data.business_hours || '',
          show_phone: settingsRes.data.show_phone !== false,
          show_email: settingsRes.data.show_email !== false,
          show_address: settingsRes.data.show_address !== false,
          show_business_hours: settingsRes.data.show_business_hours !== false,
          customer_orders_enabled: settingsRes.data.customer_orders_enabled === true,
          show_recent_product_badge: settingsRes.data.show_recent_product_badge !== false
        })
        if (settingsRes.data.color_palette && settingsRes.data.color_palette.length > 0) {
          setPalette(settingsRes.data.color_palette as ColorSwatch[])
        }
        setLogoForm({
          site_name: settingsRes.data.site_name || 'Los Primos',
          site_tagline: settingsRes.data.site_tagline || 'Distribuidora Oficial Sarubbi',
          logo_url: settingsRes.data.logo_url || '',
          logo_transparent_url: settingsRes.data.logo_transparent_url || '',
          favicon_url: settingsRes.data.favicon_url || '',
          logo_width: settingsRes.data.logo_width || 180,
          logo_sticky_width: settingsRes.data.logo_sticky_width || 144,
          use_logo_image: settingsRes.data.use_logo_image || false,
          logo_link_url: settingsRes.data.logo_link_url || '/landing'
        })
      }

      if (heroRes.data) setHeroSlides(heroRes.data as HeroSlide[])
      if (sectionsRes.data) setSections(sectionsRes.data as LandingSection[])
      if (categoriesRes.data) setLandingCategories(categoriesRes.data as EditableLandingCategory[])
      if (productsRes.data) setLandingProducts(productsRes.data as EditableLandingProduct[])
      if (announcementsRes.data) setAnnouncements(announcementsRes.data as AnnouncementMessage[])
      if (menuLinksRes.data) setMenuLinks(menuLinksRes.data as MenuLink[])
      if (headerSettingsRes.data) {
        const h = headerSettingsRes.data as HeaderSettings
        setHeaderSettings(h)
        setHeaderForm({
          bg_color: h.bg_color,
          text_color: h.text_color,
          active_color: h.active_color,
          sticky: h.sticky,
          shadow: h.shadow,
          nav_uppercase: h.nav_uppercase ?? true,
          nav_underline: h.nav_underline ?? true,
          nav_letter_spacing: h.nav_letter_spacing ?? 'wide',
          nav_font_weight: h.nav_font_weight ?? '700',
          font_family: h.font_family || 'dm_sans',
          brand_font_weight: h.brand_font_weight || 900,
          nav_text_color: h.nav_text_color || h.text_color || '#374151',
          nav_active_color: h.nav_active_color || h.active_color || '#2563eb',
          nav_transparent_text_color: h.nav_transparent_text_color || '#ffffff',
          nav_transparent_active_color: h.nav_transparent_active_color || '#ffffff',
          nav_font_family: h.nav_font_family || h.font_family || 'dm_sans',
          nav_show_icons: h.nav_show_icons ?? false,
          mobile_menu_settings: resolveMobileMenuSettings(h.mobile_menu_settings),
          info_button_label: h.info_button_label || 'Info',
          info_button_icon: h.info_button_icon || 'info',
          info_button_bg: h.info_button_bg || '#eff6ff',
          info_button_text: h.info_button_text || '#1d4ed8',
          info_panel_bg: h.info_panel_bg || '#ffffff',
          info_panel_border: h.info_panel_border || '#e5e7eb',
          info_title: h.info_title || 'Datos del Negocio',
          info_title_color: h.info_title_color || '#111827',
          info_label_color: h.info_label_color || '#6b7280',
          info_value_color: h.info_value_color || '#111827',
          info_icon_color: h.info_icon_color || '#2563eb',
          info_hover_color: h.info_hover_color || '#1d4ed8',
          info_font_family: h.info_font_family || 'dm_sans',
          info_font_weight: h.info_font_weight || '400',
          info_title_font_weight: h.info_title_font_weight || '700',
          info_phone_icon: h.info_phone_icon || 'phone',
          info_hours_icon: h.info_hours_icon || 'clock',
          info_address_icon: h.info_address_icon || 'location',
          info_email_icon: h.info_email_icon || 'mail'
        })
      }
      if (popupsRes.data) setPopups(popupsRes.data as Popup[])

      if (barSettingsRes.data) {
        const b = barSettingsRes.data as BarSettings
        setBarSettings(b)
        setBarForm({
          bg_color: b.bg_color,
          text_color: b.text_color,
          font_family: b.font_family,
          font_size: b.font_size,
          font_weight: b.font_weight,
          letter_spacing: b.letter_spacing,
          animation: b.animation
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    router.push('/admin')
  }

  // ===== SETTINGS =====
  async function saveSettings() {
    setSettingsMessage(null)

    if (!settingsForm.phone_number.trim()) {
      setSettingsMessage({ 
        type: 'error', 
        text: '⚠️ El teléfono WhatsApp es obligatorio. Por favor ingresa un número.' 
      })
      return
    }

    if (settingsForm.phone_number.trim().length < 5) {
      setSettingsMessage({ 
        type: 'error', 
        text: '⚠️ El teléfono debe tener al menos 5 caracteres (ej: +598 99 123 4567)' 
      })
      return
    }

    setSavingSettings(true)
    try {
      const dataToSave = {
        phone_number: settingsForm.phone_number.trim(),
        email: settingsForm.email.trim() || null,
        address: settingsForm.address.trim() || null,
        business_hours: settingsForm.business_hours.trim() || null,
        show_phone: settingsForm.show_phone,
        show_email: settingsForm.show_email,
        show_address: settingsForm.show_address,
        show_business_hours: settingsForm.show_business_hours,
        customer_orders_enabled: settingsForm.customer_orders_enabled,
        show_recent_product_badge: settingsForm.show_recent_product_badge,
        updated_at: new Date().toISOString()
      }

      if (settings) {
        const { error } = await supabase
          .from('website_settings')
          .update(dataToSave)
          .eq('id', settings.id)

        if (error) {
          if (error.message.includes('not-null')) {
            setSettingsMessage({ 
              type: 'error', 
              text: '❌ El teléfono es obligatorio y no puede estar vacío' 
            })
          } else if (error.message.includes('violates')) {
            setSettingsMessage({ 
              type: 'error', 
              text: '❌ Verifica los datos ingresados. Algunos campos pueden tener formato incorrecto.' 
            })
          } else {
            setSettingsMessage({ 
              type: 'error', 
              text: `❌ Error: ${error.message}` 
            })
          }
          throw error
        }

        setSettings({
          ...settings,
          ...dataToSave
        })
        setSettingsMessage({ 
          type: 'success', 
          text: '✅ Configuración guardada correctamente' 
        })
      } else {
        const { data, error } = await supabase
          .from('website_settings')
          .insert([dataToSave])
          .select()

        if (error) {
          if (error.message.includes('not-null')) {
            setSettingsMessage({ 
              type: 'error', 
              text: '❌ El teléfono es obligatorio' 
            })
          } else if (error.message.includes('violates')) {
            setSettingsMessage({ 
              type: 'error', 
              text: '❌ Verifica los datos ingresados' 
            })
          } else {
            setSettingsMessage({ 
              type: 'error', 
              text: `❌ Error: ${error.message}` 
            })
          }
          throw error
        }
        if (data) {
          setSettings(data[0] as WebsiteSettings)
          setSettingsMessage({ 
            type: 'success', 
            text: '✅ Configuración creada correctamente' 
          })
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSavingSettings(false)
    }
  }

  async function saveHeroAutoplaySettings() {
    if (!settings) return
    setSavingHeroAutoplay(true)
    setHeroAutoplayMessage(null)
    try {
      const { error } = await supabase
        .from('website_settings')
        .update({ hero_autoplay_seconds: heroAutoplaySeconds, updated_at: new Date().toISOString() })
        .eq('id', settings.id)
      if (error) throw error
      setSettings({ ...settings, hero_autoplay_seconds: heroAutoplaySeconds })
      setHeroAutoplayMessage('Intervalo guardado. Los cambios se aplican al recargar la landing.')
    } catch (error) {
      console.error('Error guardando intervalo del hero:', error)
      const details = error instanceof Error ? error.message : JSON.stringify(error)
      setHeroAutoplayMessage(`No se pudo guardar el intervalo: ${details}`)
    } finally {
      setSavingHeroAutoplay(false)
    }
  }

  async function saveFooter() {
    setFooterMessage(null)
    if (!settings?.id) {
      setFooterMessage({ type: 'error', text: 'No se encontró la configuración del sitio para guardar el footer.' })
      return
    }

    const invalidLink = footerForm.links.find(link => (link.label.trim() || link.url.trim()) && (!link.label.trim() || !safeFooterLink(link.url)))
    if (invalidLink || (footerForm.show_cta && footerForm.cta_label.trim() && !safeFooterLink(footerForm.cta_url))) {
      setFooterMessage({ type: 'error', text: 'Completá el texto y el destino de los enlaces. Usá una ruta como /catalogo o un enlace https:// válido.' })
      return
    }
    if (FOOTER_COLOR_FIELDS.some(([key]) => !/^#[\da-f]{6}$/i.test(footerForm[key]))) {
      setFooterMessage({ type: 'error', text: 'Revisá los colores: usá un código de seis dígitos, por ejemplo #292d23.' })
      return
    }
    const nextFooter = normalizeFooterSettings(footerForm)
    nextFooter.links = nextFooter.links.filter(link => link.label.trim() && link.url.trim())
    setSavingFooter(true)
    try {
      const { error } = await supabase
        .from('website_settings')
        .update({ footer_settings: nextFooter, updated_at: new Date().toISOString() })
        .eq('id', settings.id)

      if (error) throw error
      setSettings({ ...settings, footer_settings: nextFooter })
      setFooterForm(nextFooter)
      setFooterMessage({ type: 'success', text: 'Footer guardado correctamente.' })
    } catch (error) {
      console.error('Error saving footer:', error)
      setFooterMessage({ type: 'error', text: `No se pudo guardar el footer: ${error instanceof Error ? error.message : (error as { message?: string })?.message || 'Revisá tu conexión e intentá nuevamente.'}` })
    } finally {
      setSavingFooter(false)
    }
  }

  async function uploadCustomFont() {
    if (!settings?.id || !fontFile) return
    const extension = fontFile.name.split('.').pop()?.toLowerCase() || ''
    if (!['woff2', 'woff', 'ttf', 'otf'].includes(extension)) {
      alert('Usá un archivo de fuente .woff2, .woff, .ttf o .otf.')
      return
    }
    if (fontFile.size > 8 * 1024 * 1024) {
      alert('La fuente no puede superar los 8 MB.')
      return
    }

    setUploadingFont(true)
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const path = `site-fonts/${id}.${extension}`
    try {
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, fontFile, {
        cacheControl: '31536000',
        contentType: fontFile.type || `font/${extension}`,
        upsert: false
      })
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      const nextFonts = [...customFonts, { id, name: fontName.trim() || fontFile.name.replace(/\.[^.]+$/, ''), url: data.publicUrl, path }]
      const { error } = await supabase.from('website_settings').update({ custom_fonts: nextFonts, updated_at: new Date().toISOString() }).eq('id', settings.id)
      if (error) {
        await supabase.storage.from('product-images').remove([path])
        throw error
      }
      setCustomFonts(nextFonts)
      setSettings({ ...settings, custom_fonts: nextFonts })
      setFontFile(null)
      setFontName('')
      alert('Tipografía agregada. Ya está disponible en los selectores del editor.')
    } catch (error) {
      console.error('Error uploading custom font:', error)
      alert(`No se pudo guardar la tipografía: ${error instanceof Error ? error.message : 'error desconocido'}`)
    } finally {
      setUploadingFont(false)
    }
  }

  async function deleteCustomFont(font: SiteFont) {
    if (!settings?.id || !confirm(`¿Eliminar la tipografía «${font.name}»? Dejará de estar disponible para las secciones que la usen.`)) return
    const nextFonts = customFonts.filter(item => item.id !== font.id)
    const { error } = await supabase.from('website_settings').update({ custom_fonts: nextFonts, updated_at: new Date().toISOString() }).eq('id', settings.id)
    if (error) {
      alert('No se pudo eliminar la tipografía de la biblioteca.')
      return
    }
    setCustomFonts(nextFonts)
    setSettings({ ...settings, custom_fonts: nextFonts })
    const { error: storageError } = await supabase.storage.from('product-images').remove([font.path])
    if (storageError) console.error('No se pudo borrar el archivo de fuente:', storageError)
  }

  // ===== IMAGE UPLOAD =====
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, variant: 'desktop' | 'mobile' = 'desktop') {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    const { url, error } = await uploadImageToSupabase(file, 'hero-images')

    if (error) {
      alert(`❌ Error al subir imagen: ${error}`)
    } else {
      setHeroForm(current => ({ ...current, [variant === 'mobile' ? 'mobile_image_url' : 'image_url']: url }))
      if (variant === 'mobile') setMobileHeroPreview(url)
      else setImagePreview(url)
      alert(`✅ Imagen para ${variant === 'mobile' ? 'móvil' : 'escritorio'} subida correctamente`)
    }

    setUploadingImage(false)
    const inputRef = variant === 'mobile' ? mobileHeroInputRef : fileInputRef
    if (inputRef.current) inputRef.current.value = ''
  }

  // ===== HERO SLIDES =====
  async function saveHeroSlide() {
    if (!heroForm.internal_name.trim()) {
      alert('⚠️ El nombre interno del hero es obligatorio')
      return
    }

    if (!heroForm.image_url.trim()) {
      alert('⚠️ La imagen es obligatoria. Sube una foto.')
      return
    }

    setSavingHero(true)
    try {
      if (editingHero) {
        const { error } = await supabase
          .from('hero_slides')
          .update({
            internal_name: heroForm.internal_name.trim(),
            title: heroForm.title.trim() || null,
            cta_bottom_offset: heroForm.cta_bottom_offset,
            show_title_mobile: heroForm.show_title_mobile,
            show_title_desktop: heroForm.show_title_desktop,
            show_description_mobile: heroForm.show_description_mobile,
            show_description_desktop: heroForm.show_description_desktop,
            description: heroForm.description.trim() || null,
            cta_text: heroForm.cta_text.trim() || null,
            cta_url: heroForm.cta_url.trim() || null,
            image_url: heroForm.image_url.trim(),
            mobile_image_url: heroForm.mobile_image_url.trim() || null,
            desktop_text_position: heroForm.desktop_text_position,
            mobile_text_position: heroForm.mobile_text_position,
            desktop_image_position: heroForm.desktop_image_position,
            mobile_image_position: heroForm.mobile_image_position,
            desktop_image_fit: heroForm.desktop_image_fit,
            mobile_image_fit: heroForm.mobile_image_fit,
            image_darkness: heroForm.image_darkness,
            title_font: heroForm.title_font,
            body_font: heroForm.body_font,
            title_font_weight: heroForm.title_font_weight,
            body_font_weight: heroForm.body_font_weight,
            title_size_desktop: heroForm.title_size_desktop,
            title_size_mobile: heroForm.title_size_mobile,
            body_size_desktop: heroForm.body_size_desktop,
            body_size_mobile: heroForm.body_size_mobile,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingHero.id)

        if (error) throw error

        setHeroSlides(heroSlides.map(s =>
          s.id === editingHero.id
            ? {
                ...s,
                internal_name: heroForm.internal_name.trim(),
                title: heroForm.title.trim() || null,
                cta_bottom_offset: heroForm.cta_bottom_offset,
                show_title_mobile: heroForm.show_title_mobile,
                show_title_desktop: heroForm.show_title_desktop,
                show_description_mobile: heroForm.show_description_mobile,
                show_description_desktop: heroForm.show_description_desktop,
                description: heroForm.description.trim() || null,
                cta_text: heroForm.cta_text.trim() || null,
                cta_url: heroForm.cta_url.trim() || null,
                image_url: heroForm.image_url.trim(),
                mobile_image_url: heroForm.mobile_image_url.trim() || null,
                desktop_text_position: heroForm.desktop_text_position,
                mobile_text_position: heroForm.mobile_text_position,
                desktop_image_position: heroForm.desktop_image_position,
                mobile_image_position: heroForm.mobile_image_position,
                desktop_image_fit: heroForm.desktop_image_fit,
                mobile_image_fit: heroForm.mobile_image_fit,
                image_darkness: heroForm.image_darkness,
                title_font: heroForm.title_font,
                body_font: heroForm.body_font,
                title_font_weight: heroForm.title_font_weight,
                body_font_weight: heroForm.body_font_weight,
                title_size_desktop: heroForm.title_size_desktop,
                title_size_mobile: heroForm.title_size_mobile,
                body_size_desktop: heroForm.body_size_desktop,
                body_size_mobile: heroForm.body_size_mobile
              }
            : s
        ))
      } else {
        const maxOrder = heroSlides.length > 0 ? Math.max(...heroSlides.map(s => s.order_position)) : 0

        const { data, error } = await supabase
          .from('hero_slides')
          .insert([{
            internal_name: heroForm.internal_name.trim(),
            title: heroForm.title.trim() || null,
            cta_bottom_offset: heroForm.cta_bottom_offset,
            show_title_mobile: heroForm.show_title_mobile,
            show_title_desktop: heroForm.show_title_desktop,
            show_description_mobile: heroForm.show_description_mobile,
            show_description_desktop: heroForm.show_description_desktop,
            description: heroForm.description.trim() || null,
            cta_text: heroForm.cta_text.trim() || null,
            cta_url: heroForm.cta_url.trim() || null,
            image_url: heroForm.image_url.trim(),
            mobile_image_url: heroForm.mobile_image_url.trim() || null,
            desktop_text_position: heroForm.desktop_text_position,
            mobile_text_position: heroForm.mobile_text_position,
            desktop_image_position: heroForm.desktop_image_position,
            mobile_image_position: heroForm.mobile_image_position,
            desktop_image_fit: heroForm.desktop_image_fit,
            mobile_image_fit: heroForm.mobile_image_fit,
            image_darkness: heroForm.image_darkness,
            title_font: heroForm.title_font,
            body_font: heroForm.body_font,
            title_font_weight: heroForm.title_font_weight,
            body_font_weight: heroForm.body_font_weight,
            title_size_desktop: heroForm.title_size_desktop,
            title_size_mobile: heroForm.title_size_mobile,
            body_size_desktop: heroForm.body_size_desktop,
            body_size_mobile: heroForm.body_size_mobile,
            order_position: maxOrder + 1,
            is_active: true
          }])
          .select()

        if (error) throw error
        if (data) setHeroSlides([...heroSlides, data[0] as HeroSlide])
      }

      setShowHeroModal(false)
      setImagePreview('')
      setMobileHeroPreview('')
      alert('✅ Slide guardado correctamente')
    } catch (error) {
      console.error('Error saving hero:', error)
      const details = error instanceof Error ? error.message : JSON.stringify(error)
      alert(`❌ Error al guardar el slide: ${details}. Si el error menciona columnas de tamaño, aplicá primero la migración de tamaño de texto del hero en Supabase.`)
    } finally {
      setSavingHero(false)
    }
  }

  async function deleteHeroSlide(heroId: string) {
    if (!confirm('¿Eliminar este slide?')) return

    try {
      const { error } = await supabase.from('hero_slides').delete().eq('id', heroId)
      if (error) throw error
      setHeroSlides(heroSlides.filter(s => s.id !== heroId))
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error al eliminar')
    }
  }

  function openHeroModal(hero?: HeroSlide) {
    if (hero) {
      setEditingHero(hero)
      setHeroForm({
        internal_name: hero.internal_name || hero.title || `Hero ${hero.order_position}`,
        title: hero.title || '',
        cta_bottom_offset: hero.cta_bottom_offset ?? null,
        show_title_mobile: hero.show_title_mobile !== false,
        show_title_desktop: hero.show_title_desktop !== false,
        show_description_mobile: hero.show_description_mobile !== false,
        show_description_desktop: hero.show_description_desktop !== false,
        description: hero.description || '',
        cta_text: hero.cta_text || '',
        cta_url: hero.cta_url || '',
        image_url: hero.image_url,
        mobile_image_url: hero.mobile_image_url || '',
        desktop_text_position: hero.desktop_text_position || 'left',
        mobile_text_position: hero.mobile_text_position || 'left',
        desktop_image_position: hero.desktop_image_position || 'center',
        mobile_image_position: hero.mobile_image_position || 'center',
        desktop_image_fit: hero.desktop_image_fit || 'contain',
        mobile_image_fit: hero.mobile_image_fit || 'contain',
        image_darkness: hero.image_darkness ?? 18,
        title_font: hero.title_font || 'lora',
        body_font: hero.body_font || 'dm_sans',
        title_font_weight: hero.title_font_weight ?? 900,
        body_font_weight: hero.body_font_weight ?? 400,
        title_size_desktop: hero.title_size_desktop || 72,
        title_size_mobile: hero.title_size_mobile || 48,
        body_size_desktop: hero.body_size_desktop || 24,
        body_size_mobile: hero.body_size_mobile || 20
      })
      setImagePreview(hero.image_url)
      setMobileHeroPreview(hero.mobile_image_url || '')
    } else {
      setEditingHero(null)
      setHeroForm({ internal_name: '', title: '', description: '', cta_text: '', cta_url: '', cta_bottom_offset: null, show_title_mobile: true, show_title_desktop: true, show_description_mobile: true, show_description_desktop: true, image_url: '', mobile_image_url: '', desktop_text_position: 'left', mobile_text_position: 'left', desktop_image_position: 'center', mobile_image_position: 'center', desktop_image_fit: 'contain', mobile_image_fit: 'contain', image_darkness: 18, title_font: 'lora', body_font: 'dm_sans', title_font_weight: 900, body_font_weight: 400, title_size_desktop: 72, title_size_mobile: 48, body_size_desktop: 24, body_size_mobile: 20 })
      setImagePreview('')
      setMobileHeroPreview('')
    }
    setShowHeroModal(true)
  }

  // ===== LANDING SECTIONS =====
  async function uploadLandingAsset(file: File | undefined, onUploaded: (url: string) => void, preset: 'default' | 'category-icon' = 'default') {
    if (!file) return
    setUploadingImage(true)
    try {
      const { url, error } = await uploadImageToSupabase(file, 'landing-sections', preset)
      if (error) throw new Error(error)
      onUploaded(url)
    } catch (error) {
      console.error('Error uploading landing block image:', error)
      alert(error instanceof Error ? error.message : 'No se pudo subir la imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  async function uploadSectionImage(file: File | undefined, variant: 'desktop' | 'mobile' = 'desktop') {
    await uploadLandingAsset(file, url => variant === 'mobile'
      ? updateLandingSettings({ mobile_image_url: url })
      : setSectionForm(current => ({ ...current, image_url: url })))
  }

  function updateLandingCard(index: number, changes: Partial<LandingFeatureCard>) {
    setSectionForm(current => {
      const cards = current.settings.cards || []
      return { ...current, settings: { ...current.settings, cards: cards.map((card, cardIndex) => cardIndex === index ? { ...card, ...changes } : card) } }
    })
  }

  function updateLandingInstructionStep(index: number, changes: Partial<LandingInstructionStep>) {
    setSectionForm(current => {
      const steps = current.settings.instruction_steps || []
      return { ...current, settings: { ...current.settings, instruction_steps: steps.map((step, stepIndex) => stepIndex === index ? { ...step, ...changes } : step) } }
    })
  }

  function updateLandingSettings(changes: Partial<LandingSectionSettings>) {
    setSectionForm(current => ({ ...current, settings: { ...current.settings, ...changes } }))
  }

  function updateLandingSlide(index: number, changes: Partial<LandingCarouselSlide>) {
    setSectionForm(current => {
      const slides = current.settings.slides || []
      return { ...current, settings: { ...current.settings, slides: slides.map((slide, slideIndex) => slideIndex === index ? { ...slide, ...changes } : slide) } }
    })
  }

  async function saveSection() {
    if (!sectionForm.section_name.trim() || !sectionForm.title.trim()) {
      alert('El nombre del bloque y el título son obligatorios')
      return
    }

    let savedSettings = sectionForm.settings
    if (sectionForm.block_type === 'location_map') {
      const embedInput = sectionForm.settings.map_embed_url?.trim() || ''
      const directionsInput = sectionForm.settings.map_link_url?.trim() || ''
      if (embedInput && !googleMapsEmbedSource(embedInput)) {
        alert('Pegá un enlace para insertar de Google Maps o su código iframe. También podés dejar ese campo vacío y usar la dirección.')
        return
      }
      if (directionsInput && !safeLocationLink(directionsInput)) {
        alert('El enlace del botón debe comenzar con https:// o http://. Si lo dejás vacío, se genera desde la dirección.')
        return
      }
      savedSettings = { ...sectionForm.settings, map_embed_url: embedInput ? googleMapsEmbedSource(embedInput)! : '', map_link_url: directionsInput ? safeLocationLink(directionsInput)! : '' }
    }

    setSavingSection(true)
    try {
      if (editingSection) {
        const { error } = await supabase
          .from('landing_sections')
          .update({
            section_name: sectionForm.section_name.trim(),
            block_type: sectionForm.block_type,
            settings: savedSettings,
            title: sectionForm.title.trim(),
            subtitle: sectionForm.subtitle.trim() || null,
            description: sectionForm.description.trim() || null,
            image_url: sectionForm.image_url.trim() || null,
            is_visible: sectionForm.is_visible,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSection.id)

        if (error) throw error

        setSections(current => current.map(s =>
          s.id === editingSection.id
            ? {
                ...s,
                section_name: sectionForm.section_name.trim(),
                block_type: sectionForm.block_type,
                settings: savedSettings,
                order_position: s.order_position,
                title: sectionForm.title.trim(),
                subtitle: sectionForm.subtitle.trim() || null,
                description: sectionForm.description.trim() || null,
                image_url: sectionForm.image_url.trim() || null,
                is_visible: sectionForm.is_visible
              }
            : s
        ).sort((a, b) => a.order_position - b.order_position))
      } else {
        const { data, error } = await supabase
          .from('landing_sections')
          .insert({
            section_name: sectionForm.section_name.trim(),
            block_type: sectionForm.block_type,
            settings: savedSettings,
            order_position: sections.length ? Math.max(...sections.map(section => section.order_position)) + 10 : 10,
            title: sectionForm.title.trim(),
            subtitle: sectionForm.subtitle.trim() || null,
            description: sectionForm.description.trim() || null,
            image_url: sectionForm.image_url.trim() || null,
            is_visible: sectionForm.is_visible
          })
          .select('*')
          .single()

        if (error) throw error
        setSections(current => [...current, data as LandingSection].sort((a, b) => a.order_position - b.order_position))
      }

      setShowSectionModal(false)
      alert('✅ Sección guardada')
    } catch (error) {
      console.error('Error saving section:', error)
      alert('Error al guardar')
    } finally {
      setSavingSection(false)
    }
  }

  function openSectionModal(section?: LandingSection) {
    if (section) {
      setEditingSection(section)
      setSectionForm({
        section_name: section.section_name || '',
        title: section.title || '',
        subtitle: section.subtitle || '',
        description: section.description || '',
        image_url: section.image_url || '',
        is_visible: section.is_visible,
        block_type: section.block_type || 'content',
        settings: { ...defaultLandingSettings(section.block_type || 'content'), ...(section.settings || {}) }
      })
    } else {
      setEditingSection(null)
      const block_type: LandingBlockType = 'content'
      setSectionForm({ section_name: '', title: '', subtitle: '', description: '', image_url: '', is_visible: true, block_type, settings: defaultLandingSettings(block_type) })
    }
    setShowSectionModal(true)
  }

  async function toggleLandingSection(section: LandingSection) {
    const nextVisible = !section.is_visible
    try {
      const { error } = await supabase
        .from('landing_sections')
        .update({ is_visible: nextVisible, updated_at: new Date().toISOString() })
        .eq('id', section.id)
      if (error) throw error
      setSections(current => current.map(item => item.id === section.id ? { ...item, is_visible: nextVisible } : item))
    } catch (error) {
      console.error('Error updating landing block visibility:', error)
      alert('No se pudo actualizar la visibilidad del bloque')
    }
  }

  async function deleteLandingSection(section: LandingSection) {
    if (!confirm(`¿Eliminar el bloque "${section.section_name}"? Esta acción no se puede deshacer.`)) return
    try {
      const { error } = await supabase.from('landing_sections').delete().eq('id', section.id)
      if (error) throw error
      setSections(current => current.filter(item => item.id !== section.id))
    } catch (error) {
      console.error('Error deleting landing block:', error)
      alert('No se pudo eliminar el bloque')
    }
  }

  async function moveLandingSection(section: LandingSection, direction: -1 | 1) {
    const currentIndex = sections.findIndex(item => item.id === section.id)
    const targetIndex = currentIndex + direction
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sections.length) return
    const reordered = [...sections]
    ;[reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]]
    const positioned = reordered.map((item, index) => ({ ...item, order_position: (index + 1) * 10 }))
    setSections(positioned)
    const results = await Promise.all(positioned.map(item =>
      supabase.from('landing_sections').update({ order_position: item.order_position }).eq('id', item.id)
    ))
    const failed = results.find(result => result.error)
    if (failed?.error) {
      console.error('Error reordering landing blocks:', failed.error)
      alert('No se pudo guardar el nuevo orden. Recargá la página e intentá de nuevo.')
      loadData()
    }
  }

  // ===== ANNOUNCEMENT BAR =====
  async function saveAnnouncement() {
    if (!announcementForm.message.trim()) {
      alert('⚠️ El mensaje es obligatorio')
      return
    }

    setSavingAnnouncement(true)
    try {
      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcement_messages')
          .update({
            message: announcementForm.message.trim(),
            icon: announcementForm.icon.trim() || null,
            link_text: announcementForm.link_text.trim() || null,
            link_url: announcementForm.link_url.trim() || null,
            is_active: announcementForm.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAnnouncement.id)

        if (error) throw error

        setAnnouncements(announcements.map(a =>
          a.id === editingAnnouncement.id
            ? {
                ...a,
                message: announcementForm.message.trim(),
                icon: announcementForm.icon.trim() || null,
                link_text: announcementForm.link_text.trim() || null,
                link_url: announcementForm.link_url.trim() || null,
                is_active: announcementForm.is_active
              }
            : a
        ))
      } else {
        const maxOrder = announcements.length > 0 ? Math.max(...announcements.map(a => a.order_position)) : 0

        const { data, error } = await supabase
          .from('announcement_messages')
          .insert([{
            message: announcementForm.message.trim(),
            icon: announcementForm.icon.trim() || null,
            link_text: announcementForm.link_text.trim() || null,
            link_url: announcementForm.link_url.trim() || null,
            is_active: announcementForm.is_active,
            order_position: maxOrder + 1
          }])
          .select()

        if (error) throw error
        if (data) setAnnouncements([...announcements, data[0] as AnnouncementMessage])
      }

      setShowAnnouncementModal(false)
      alert('✅ Mensaje guardado correctamente')
    } catch (error) {
      console.error('Error saving announcement:', error)
      alert('❌ Error al guardar. Verificá que la tabla "announcement_messages" ya exista en Supabase.')
    } finally {
      setSavingAnnouncement(false)
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm('¿Eliminar este mensaje?')) return

    try {
      const { error } = await supabase.from('announcement_messages').delete().eq('id', id)
      if (error) throw error
      setAnnouncements(announcements.filter(a => a.id !== id))
    } catch (error) {
      console.error('Error deleting announcement:', error)
      alert('❌ Error al eliminar')
    }
  }

  async function toggleAnnouncementActive(announcement: AnnouncementMessage) {
    try {
      const { error } = await supabase
        .from('announcement_messages')
        .update({ is_active: !announcement.is_active })
        .eq('id', announcement.id)

      if (error) throw error

      setAnnouncements(announcements.map(a =>
        a.id === announcement.id ? { ...a, is_active: !a.is_active } : a
      ))
    } catch (error) {
      console.error('Error toggling announcement:', error)
      alert('❌ Error al actualizar')
    }
  }

  async function moveAnnouncement(id: string, direction: 'up' | 'down') {
    const sorted = [...announcements].sort((a, b) => a.order_position - b.order_position)
    const idx = sorted.findIndex(a => a.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const current = sorted[idx]
    const swapWith = sorted[swapIdx]

    try {
      await Promise.all([
        supabase.from('announcement_messages').update({ order_position: swapWith.order_position }).eq('id', current.id),
        supabase.from('announcement_messages').update({ order_position: current.order_position }).eq('id', swapWith.id)
      ])

      setAnnouncements(announcements.map(a => {
        if (a.id === current.id) return { ...a, order_position: swapWith.order_position }
        if (a.id === swapWith.id) return { ...a, order_position: current.order_position }
        return a
      }))
    } catch (error) {
      console.error('Error reordering:', error)
      alert('❌ Error al reordenar')
    }
  }

  function openAnnouncementModal(announcement?: AnnouncementMessage) {
    if (announcement) {
      setEditingAnnouncement(announcement)
      setAnnouncementForm({
        message: announcement.message,
        icon: announcement.icon || '',
        link_text: announcement.link_text || '',
        link_url: announcement.link_url || '',
        is_active: announcement.is_active
      })
    } else {
      setEditingAnnouncement(null)
      setAnnouncementForm({ message: '', icon: '', link_text: '', link_url: '', is_active: true })
    }
    setShowAnnouncementModal(true)
  }

  // ===== PALETA DE COLORES =====
  function updatePaletteColor(index: number, field: 'name' | 'hex', value: string) {
    setPalette(palette.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  function addPaletteColor() {
    setPalette([...palette, { name: 'Nuevo color', hex: '#888888' }])
  }

  function removePaletteColor(index: number) {
    setPalette(palette.filter((_, i) => i !== index))
  }

  async function savePalette() {
    if (!settings) return
    setSavingPalette(true)
    try {
      const { error } = await supabase
        .from('website_settings')
        .update({ color_palette: palette, updated_at: new Date().toISOString() })
        .eq('id', settings.id)

      if (error) throw error
      alert('✅ Paleta guardada correctamente')
    } catch (error) {
      console.error('Error saving palette:', error)
      alert('❌ Error al guardar la paleta')
    } finally {
      setSavingPalette(false)
    }
  }

  // ===== HEADER: LOGO Y NOMBRE =====
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>, variant: 'standard' | 'transparent') {
    const file = e.target.files?.[0]
    if (!file) return

    const field = variant === 'transparent' ? 'logo_transparent_url' : 'logo_url'
    setUploadingLogo(true)
    try {
      const { url, error: uploadError } = await uploadImageToSupabase(file, 'logo')
      if (uploadError || !url) throw new Error(uploadError || 'No se recibió la URL del archivo')

      // Mostrarlo de inmediato y guardar la URL ahora; así no depende de que
      // el formulario completo se guarde después ni de un estado obsoleto.
      setLogoForm(current => ({ ...current, [field]: url }))
      if (!settings) throw new Error('La configuración del sitio todavía no está cargada')

      const { error: saveError } = await supabase
        .from('website_settings')
        .update({ [field]: url, updated_at: new Date().toISOString() })
        .eq('id', settings.id)
      if (saveError) {
        throw new Error(`El archivo se subió, pero Supabase no guardó su URL: ${saveError.message}`)
      }

      setSettings(current => current ? { ...current, [field]: url } : current)
    } catch (error) {
      console.error('Error uploading/saving logo:', error)
      alert(`❌ No se pudo guardar el logo. ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  async function saveLogo() {
    if (!settings) return
    setSavingLogo(true)
    try {
      const { error } = await supabase
        .from('website_settings')
        .update({
          site_name: logoForm.site_name.trim() || 'Los Primos',
          site_tagline: logoForm.site_tagline.trim(),
          logo_url: logoForm.logo_url || null,
          logo_transparent_url: logoForm.logo_transparent_url || null,
          favicon_url: logoForm.favicon_url || null,
          logo_width: logoForm.logo_width,
          logo_sticky_width: logoForm.logo_sticky_width,
          use_logo_image: logoForm.use_logo_image,
          logo_link_url: logoForm.logo_link_url.trim() || '/landing',
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)

      if (error) throw error
      alert('✅ Logo y nombre guardados correctamente')
    } catch (error) {
      console.error('Error saving logo:', error)
      alert('❌ Error al guardar')
    } finally {
      setSavingLogo(false)
    }
  }

  async function handleFaviconUpload(file: File | undefined) {
    if (!file || !settings) return
    setUploadingLogo(true)
    try {
      const { url, error: uploadError } = await uploadImageToSupabase(file, 'favicons')
      if (uploadError || !url) throw new Error(uploadError || 'No se recibió la URL del archivo')
      const { error: saveError } = await supabase
        .from('website_settings')
        .update({ favicon_url: url, updated_at: new Date().toISOString() })
        .eq('id', settings.id)
      if (saveError) throw new Error(`El archivo se subió, pero no se guardó su URL: ${saveError.message}`)
      setLogoForm(current => ({ ...current, favicon_url: url }))
      setSettings(current => current ? { ...current, favicon_url: url } : current)
      alert('✅ Favicon guardado. Puede tardar unos segundos en actualizarse en la pestaña del navegador.')
    } catch (error) {
      console.error('Error uploading/saving favicon:', error)
      alert(`❌ No se pudo guardar el favicon. ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setUploadingLogo(false)
    }
  }

  async function removeFavicon() {
    if (!settings) return
    setUploadingLogo(true)
    try {
      const { error } = await supabase
        .from('website_settings')
        .update({ favicon_url: null, updated_at: new Date().toISOString() })
        .eq('id', settings.id)
      if (error) throw error
      setLogoForm(current => ({ ...current, favicon_url: '' }))
      setSettings(current => current ? { ...current, favicon_url: null } : current)
    } catch (error) {
      console.error('Error removing favicon:', error)
      alert('❌ No se pudo quitar el favicon.')
    } finally {
      setUploadingLogo(false)
    }
  }

  // ===== HEADER: ENLACES DE MENÚ =====
  function openMenuLinkModal(link?: MenuLink) {
    if (link) {
      setEditingMenuLink(link)
      setMenuLinkForm({ label: link.label, url: link.url, is_active: link.is_active, icon: link.icon || defaultMenuIcon(link.url) })
    } else {
      setEditingMenuLink(null)
      setMenuLinkForm({ label: '', url: '', is_active: true, icon: 'link' })
    }
    setShowMenuLinkModal(true)
  }

  async function saveMenuLink() {
    if (!menuLinkForm.label.trim() || !menuLinkForm.url.trim()) {
      alert('⚠️ El texto y la URL son obligatorios')
      return
    }

    setSavingMenuLink(true)
    try {
      if (editingMenuLink) {
        const { error } = await supabase
          .from('menu_links')
          .update({ label: menuLinkForm.label.trim(), url: menuLinkForm.url.trim(), is_active: menuLinkForm.is_active, icon: menuLinkForm.icon })
          .eq('id', editingMenuLink.id)

        if (error) throw error
        setMenuLinks(menuLinks.map(l => l.id === editingMenuLink.id ? { ...l, ...menuLinkForm } : l))
      } else {
        const maxOrder = menuLinks.length > 0 ? Math.max(...menuLinks.map(l => l.order_position)) : 0
        const { data, error } = await supabase
          .from('menu_links')
          .insert([{ ...menuLinkForm, label: menuLinkForm.label.trim(), url: menuLinkForm.url.trim(), order_position: maxOrder + 1 }])
          .select()

        if (error) throw error
        if (data) setMenuLinks([...menuLinks, data[0] as MenuLink])
      }

      setShowMenuLinkModal(false)
      alert('✅ Enlace guardado correctamente')
    } catch (error) {
      console.error('Error saving menu link:', error)
      alert('❌ Error al guardar. Verificá que la tabla "menu_links" ya exista en Supabase.')
    } finally {
      setSavingMenuLink(false)
    }
  }

  async function deleteMenuLink(id: string) {
    if (!confirm('¿Eliminar este enlace del menú?')) return
    try {
      const { error } = await supabase.from('menu_links').delete().eq('id', id)
      if (error) throw error
      setMenuLinks(menuLinks.filter(l => l.id !== id))
    } catch (error) {
      console.error('Error deleting menu link:', error)
      alert('❌ Error al eliminar')
    }
  }

  async function toggleMenuLinkActive(link: MenuLink) {
    try {
      const { error } = await supabase.from('menu_links').update({ is_active: !link.is_active }).eq('id', link.id)
      if (error) throw error
      setMenuLinks(menuLinks.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l))
    } catch (error) {
      console.error('Error toggling menu link:', error)
      alert('❌ Error al actualizar')
    }
  }

  async function moveMenuLink(id: string, direction: 'up' | 'down') {
    const sorted = [...menuLinks].sort((a, b) => a.order_position - b.order_position)
    const idx = sorted.findIndex(l => l.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const current = sorted[idx]
    const swapWith = sorted[swapIdx]

    try {
      await Promise.all([
        supabase.from('menu_links').update({ order_position: swapWith.order_position }).eq('id', current.id),
        supabase.from('menu_links').update({ order_position: current.order_position }).eq('id', swapWith.id)
      ])

      setMenuLinks(menuLinks.map(l => {
        if (l.id === current.id) return { ...l, order_position: swapWith.order_position }
        if (l.id === swapWith.id) return { ...l, order_position: current.order_position }
        return l
      }))
    } catch (error) {
      console.error('Error reordering menu links:', error)
      alert('❌ Error al reordenar')
    }
  }

  // ===== HEADER: ESTILO =====
  async function saveHeaderSettings() {
    if (!headerSettings) return
    setSavingHeaderSettings(true)
    try {
      let { error } = await supabase
        .from('header_settings')
        .update({ ...headerForm, updated_at: new Date().toISOString() })
        .eq('id', headerSettings.id)
        .select('id')
        .single()

      const { mobile_menu_settings, ...desktopForm } = headerForm
      let mobileSettingsSaved = true
      // A pending mobile migration must not prevent saving existing desktop fields.
      if (error && ['PGRST204', '42703'].includes(error.code) && error.message.includes('mobile_menu_settings')) {
        const result = await supabase.from('header_settings')
          .update({ ...desktopForm, updated_at: new Date().toISOString() })
          .eq('id', headerSettings.id)
          .select('id')
          .single()
        error = result.error
        mobileSettingsSaved = false
      }

      if (error) throw error
      setHeaderSettings({ ...headerSettings, ...(mobileSettingsSaved ? { ...desktopForm, mobile_menu_settings } : desktopForm) })
      alert(mobileSettingsSaved
        ? '✅ Estilo guardado correctamente'
        : '✅ Se guardó el estilo de escritorio. Los colores personalizados del menú móvil todavía no se guardaron: ejecutá supabase/migrations/202610210001_mobile_menu_colors.sql en Supabase y después volvé a guardar.')
    } catch (error) {
      console.error('Error saving header settings:', error)
      const details = error instanceof Error ? error.message : (error as { message?: string })?.message || 'Error desconocido'
      if (details.includes('mobile_menu_settings')) {
        alert('❌ Para guardar los colores del menú móvil, ejecutá primero el archivo supabase/migrations/202610210001_mobile_menu_colors.sql en el SQL Editor de Supabase. Después volvé a guardar.')
      } else {
        alert(`❌ No se pudo guardar el estilo del header: ${details}`)
      }
    } finally {
      setSavingHeaderSettings(false)
    }
  }

  // ===== POP-UPS =====
  function openPopupModal(popup?: Popup) {
    if (popup) {
      setEditingPopup(popup)
      setPopupForm({
        name: popup.name,
        is_active: popup.is_active,
        content_mode: popup.content_mode,
        font_family: popup.font_family || 'dm_sans',
        font_weight: popup.font_weight || 400,
        title: popup.title || '',
        message: popup.message || '',
        image_url: popup.image_url || '',
        cta_text: popup.cta_text || '',
        cta_url: popup.cta_url || '',
        bg_color: popup.bg_color,
        text_color: popup.text_color,
        button_bg_color: popup.button_bg_color,
        button_text_color: popup.button_text_color,
        clickable_image_url: popup.clickable_image_url || '',
        clickable_image_link: popup.clickable_image_link || '',
        trigger_on_load: popup.trigger_on_load,
        trigger_on_load_delay: popup.trigger_on_load_delay,
        trigger_on_scroll: popup.trigger_on_scroll,
        trigger_on_scroll_percent: popup.trigger_on_scroll_percent,
        trigger_on_exit: popup.trigger_on_exit,
        show_on_landing: popup.show_on_landing,
        show_on_catalogo: popup.show_on_catalogo,
        show_once_per_session: popup.show_once_per_session,
        border_style: popup.border_style,
        border_width: popup.border_width,
        border_color: popup.border_color,
        border_radius: popup.border_radius,
        dash_length: popup.dash_length,
        dash_gap: popup.dash_gap,
        shape: popup.shape
      })
    } else {
      setEditingPopup(null)
      setPopupForm({
        name: '', is_active: true, content_mode: 'builder', font_family: 'dm_sans', font_weight: 400,
        title: '', message: '', image_url: '', cta_text: '', cta_url: '',
        bg_color: '#ffffff', text_color: '#111827', button_bg_color: '#2563eb', button_text_color: '#ffffff',
        clickable_image_url: '', clickable_image_link: '',
        trigger_on_load: true, trigger_on_load_delay: 3,
        trigger_on_scroll: false, trigger_on_scroll_percent: 50,
        trigger_on_exit: false,
        show_on_landing: true, show_on_catalogo: true, show_once_per_session: true,
        border_style: 'none', border_width: 2, border_color: '#111827', border_radius: 16,
        dash_length: 8, dash_gap: 6, shape: 'rectangular'
      })
    }
    setShowPopupModal(true)
  }

  async function handlePopupImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPopupImage(true)
    const { url, error } = await uploadImageToSupabase(file, 'popups')
    if (error) {
      alert(`❌ Error al subir la imagen: ${error}`)
    } else {
      setPopupForm({ ...popupForm, image_url: url })
    }
    setUploadingPopupImage(false)
  }

  async function handleClickableImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingClickableImage(true)
    const { url, error } = await uploadImageToSupabase(file, 'popups')
    if (error) {
      alert(`❌ Error al subir la imagen: ${error}`)
    } else {
      setPopupForm({ ...popupForm, clickable_image_url: url })
    }
    setUploadingClickableImage(false)
  }

  async function savePopup() {
    if (!popupForm.name.trim()) {
      alert('⚠️ Ponele un nombre interno al pop-up para identificarlo')
      return
    }
    if (popupForm.content_mode === 'image' && !popupForm.clickable_image_url) {
      alert('⚠️ Subí la imagen del pop-up')
      return
    }
    if (popupForm.content_mode === 'builder' && !popupForm.title.trim() && !popupForm.message.trim()) {
      alert('⚠️ Completá al menos el título o el mensaje')
      return
    }

    setSavingPopup(true)
    try {
      const payload = {
        ...popupForm,
        name: popupForm.name.trim(),
        title: popupForm.title.trim() || null,
        message: popupForm.message.trim() || null,
        image_url: popupForm.image_url || null,
        cta_text: popupForm.cta_text.trim() || null,
        cta_url: popupForm.cta_url.trim() || null,
        clickable_image_url: popupForm.clickable_image_url || null,
        clickable_image_link: popupForm.clickable_image_link.trim() || null
      }

      if (editingPopup) {
        const { error } = await supabase.from('popups').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingPopup.id)
        if (error) throw error
        setPopups(popups.map(p => p.id === editingPopup.id ? { ...p, ...payload } : p))
      } else {
        const maxOrder = popups.length > 0 ? Math.max(...popups.map(p => p.order_position)) : 0
        const { data, error } = await supabase.from('popups').insert([{ ...payload, order_position: maxOrder + 1 }]).select()
        if (error) throw error
        if (data) setPopups([...popups, data[0] as Popup])
      }

      setShowPopupModal(false)
      alert('✅ Pop-up guardado correctamente')
    } catch (error) {
      console.error('Error saving popup:', error)
      alert('❌ Error al guardar. Verificá que la tabla "popups" ya exista en Supabase.')
    } finally {
      setSavingPopup(false)
    }
  }

  async function deletePopup(id: string) {
    if (!confirm('¿Eliminar este pop-up?')) return
    try {
      const { error } = await supabase.from('popups').delete().eq('id', id)
      if (error) throw error
      setPopups(popups.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting popup:', error)
      alert('❌ Error al eliminar')
    }
  }

  async function togglePopupActive(popup: Popup) {
    try {
      const { error } = await supabase.from('popups').update({ is_active: !popup.is_active }).eq('id', popup.id)
      if (error) throw error
      setPopups(popups.map(p => p.id === popup.id ? { ...p, is_active: !p.is_active } : p))
    } catch (error) {
      console.error('Error toggling popup:', error)
      alert('❌ Error al actualizar')
    }
  }

  async function saveBarSettings() {
    if (!barSettings) return
    setSavingBarSettings(true)
    try {
      const { error } = await supabase
        .from('announcement_bar_settings')
        .update({ ...barForm, updated_at: new Date().toISOString() })
        .eq('id', barSettings.id)

      if (error) throw error
      setBarSettings({ ...barSettings, ...barForm })
      alert('✅ Diseño guardado correctamente')
    } catch (error) {
      console.error('Error saving bar settings:', error)
      alert('❌ Error al guardar. Verificá que la tabla "announcement_bar_settings" ya exista en Supabase.')
    } finally {
      setSavingBarSettings(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="animate-pulse text-text-muted">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-zinc-800 text-white sticky top-0 z-20">
        <div className="px-4 pt-safe-top">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-bold text-lg leading-tight">Edición Web</h1>
                <p className="text-sm text-white/70">Configura tu landing y catálogo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Contenido */}
      <div className="flex-1 lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start lg:px-5 lg:pb-8">
      <aside className="px-4 pt-2 pb-4 lg:px-0 lg:pt-0 lg:pb-0 lg:col-span-2 lg:sticky lg:top-24">
        <nav aria-label="Navegación de edición web" className="rounded-2xl border border-border bg-surface p-2 shadow-sm">
          <p className="hidden lg:block px-3 pt-2 pb-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">Editor del sitio</p>
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            <button
              onClick={() => setActiveTab('settings')}
              aria-current={activeTab === 'settings' ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors lg:w-full ${activeTab === 'settings' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-gray-100 hover:text-text'}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-current/10"><Icon name="settings" className="h-4 w-4" /></span><span>Configuración</span>
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              aria-current={activeTab === 'sections' ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors lg:w-full ${activeTab === 'sections' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-gray-100 hover:text-text'}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-current/10"><Icon name="layers" className="h-4 w-4" /></span><span>Secciones</span>
            </button>
          </div>
          {activeTab === 'sections' && (
            <div className="mt-2 flex gap-1 overflow-x-auto border-t border-border pt-2 lg:flex-col lg:overflow-visible">
              {[
                { key: 'announcement', label: 'Barra de anuncios', icon: 'megaphone' as IconName },
                { key: 'header', label: 'Header y menú', icon: 'compass' as IconName },
                { key: 'hero', label: 'Hero', icon: 'image' as IconName },
                { key: 'landing', label: 'Bloques de landing', icon: 'document' as IconName },
                { key: 'popups', label: 'Pop-ups', icon: 'chat' as IconName },
                { key: 'footer', label: 'Footer', icon: 'shoe' as IconName },
                { key: 'fonts', label: 'Tipografías', icon: 'type' as IconName },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setSectionView(item.key as typeof sectionView)}
                  aria-current={sectionView === item.key ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors lg:w-full ${sectionView === item.key ? 'bg-blue-50 font-semibold text-primary' : 'text-text-muted hover:bg-gray-50 hover:text-text'}`}
                >
                  <Icon name={item.icon} className="h-4 w-4 shrink-0" /><span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </nav>
      </aside>

      <div className="flex-1 px-4 pb-6 max-w-3xl lg:px-0 lg:pb-0 lg:col-span-6 lg:max-w-none">
        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="card max-w-2xl">
            <h3 className="font-bold text-xl mb-6">Datos del Negocio</h3>

            {settingsMessage && (
              <div className={`mb-6 p-4 rounded-lg ${
                settingsMessage.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {settingsMessage.text}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Teléfono WhatsApp * <span className="text-red-500">(obligatorio)</span></label>
                <input
                  type="tel"
                  value={settingsForm.phone_number}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone_number: e.target.value })}
                  placeholder="+598 99 123 4567"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Email</label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  placeholder="info@losprimos.com"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Dirección</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  placeholder="Calle, número, ciudad"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Horarios</label>
                <input
                  type="text"
                  value={settingsForm.business_hours}
                  onChange={(e) => setSettingsForm({ ...settingsForm, business_hours: e.target.value })}
                  placeholder="Lunes a Viernes: 7:00 - 18:00"
                  className="input"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-bold text-lg mb-2">Pedidos desde el catálogo</h4>
              <p className="text-sm text-text-muted mb-4">Habilita pedidos sin registro para retirar en mostrador y funciones de cuenta para empresas aprobadas, incluidas las listas guardadas. Al desactivarlo se ocultan el carrito de pedidos y las cuentas; el catálogo y la consulta de precios siguen disponibles.</p>
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border p-4">
                <input
                  type="checkbox"
                  checked={settingsForm.customer_orders_enabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, customer_orders_enabled: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 mt-0.5"
                />
                <span>
                  <span className="block font-semibold text-gray-800">Habilitar pedidos de clientes</span>
                  <span className="block text-sm text-gray-500 mt-1">Desactivado por defecto. Podés volver a habilitarlo cuando quieras.</span>
                </span>
              </label>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-bold text-lg mb-2">Novedades del catálogo</h4>
              <p className="text-sm text-text-muted mb-4">Los productos creados en las últimas 48 horas pueden mostrar una etiqueta en su tarjeta.</p>
              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border p-4">
                <input
                  type="checkbox"
                  checked={settingsForm.show_recent_product_badge}
                  onChange={(e) => setSettingsForm({ ...settingsForm, show_recent_product_badge: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 mt-0.5"
                />
                <span>
                  <span className="block font-semibold text-gray-800">Mostrar “Recién agregado”</span>
                  <span className="block text-sm text-gray-500 mt-1">Activado por defecto; podés ocultar todas las etiquetas desde acá.</span>
                </span>
              </label>
            </div>

            {/* Visibilidad de Datos */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-bold text-lg mb-4">¿Qué datos mostrar en el Header?</h4>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.show_phone || false}
                    onChange={(e) => setSettingsForm({ ...settingsForm, show_phone: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="inline-flex items-center gap-2 font-semibold text-gray-700"><Icon name="phone" className="h-4 w-4 text-primary" />Mostrar Teléfono</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.show_business_hours || false}
                    onChange={(e) => setSettingsForm({ ...settingsForm, show_business_hours: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="inline-flex items-center gap-2 font-semibold text-gray-700"><Icon name="clock" className="h-4 w-4 text-primary" />Mostrar Horarios</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.show_address || false}
                    onChange={(e) => setSettingsForm({ ...settingsForm, show_address: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="inline-flex items-center gap-2 font-semibold text-gray-700"><Icon name="location" className="h-4 w-4 text-primary" />Mostrar Dirección</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.show_email || false}
                    onChange={(e) => setSettingsForm({ ...settingsForm, show_email: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="inline-flex items-center gap-2 font-semibold text-gray-700"><Icon name="mail" className="h-4 w-4 text-primary" />Mostrar Email</span>
                </label>
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="btn btn-primary w-full mt-6"
            >
              {savingSettings ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        )}

        {/* PALETA DE COLORES GLOBAL */}
        {activeTab === 'settings' && (
          <div className="card max-w-2xl mt-6">
            <h3 className="mb-2 inline-flex items-center gap-2 font-bold text-xl"><Icon name="palette" className="h-5 w-5 text-primary" />Paleta de Colores</h3>
            <p className="text-sm text-text-muted mb-6">
              Colores reutilizables en toda la web (barra de anuncios y futuras secciones).
            </p>

            <div className="space-y-3 mb-4">
              {palette.map((swatch, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <input
                      type="color"
                      value={swatch.hex}
                      onChange={(e) => updatePaletteColor(idx, 'hex', e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-10 h-10 rounded-full border-2 border-white shadow pointer-events-none" style={{ backgroundColor: swatch.hex }} />
                  </div>
                  <input
                    type="text"
                    value={swatch.name}
                    onChange={(e) => updatePaletteColor(idx, 'name', e.target.value)}
                    className="input flex-1"
                    placeholder="Nombre del color"
                  />
                  <input
                    type="text"
                    value={swatch.hex}
                    onChange={(e) => updatePaletteColor(idx, 'hex', e.target.value)}
                    className="input !w-28 font-mono text-xs"
                  />
                  <button
                    onClick={() => removePaletteColor(idx)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addPaletteColor}
              className="text-sm font-semibold text-primary hover:underline mb-6"
            >
              + Agregar color
            </button>

            <button
              onClick={savePalette}
              disabled={savingPalette}
              className="btn btn-primary w-full"
            >
              {savingPalette ? 'Guardando...' : 'Guardar Paleta'}
            </button>
          </div>
        )}

        {/* BARRA DE ANUNCIOS */}
        {activeTab === 'sections' && sectionView === 'announcement' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-xl">Barra de Anuncios</h3>
                <p className="text-sm text-text-muted">Mensajes que aparecen arriba del header (envíos, descuentos, etc.)</p>
              </div>
              <button
                onClick={() => openAnnouncementModal()}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all whitespace-nowrap"
              >
                + Nuevo Mensaje
              </button>
            </div>

            {/* Vista previa en vivo (con el diseño aplicado) */}
            {announcements.filter(a => a.is_active).length > 0 && (() => {
              const preview = announcements.filter(a => a.is_active).sort((a, b) => a.order_position - b.order_position)[0]
              const FONT_FAMILY_MAP: Record<string, string> = {
                default: "'DM Sans', sans-serif",
                fira_sans: "'Fira Sans', sans-serif",
                serif: "Georgia, 'Times New Roman', serif",
                mono: "'Courier New', monospace"
              }
              const LETTER_SPACING_MAP: Record<string, string> = { normal: 'normal', wide: '0.025em', wider: '0.05em' }
              const isGradient = barForm.animation === 'gradient'
              const animClass = barForm.animation !== 'none' ? `ann-preview-${barForm.animation}` : ''

              return (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-text-muted mb-2">VISTA PREVIA</p>
                  <style>{`
                    .ann-preview-pulse { animation: annPreviewPulse 2.4s ease-in-out infinite; }
                    @keyframes annPreviewPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.75; } }
                    .ann-preview-shimmer { position: relative; overflow: hidden; }
                    .ann-preview-shimmer::after {
                      content: ''; position: absolute; top: 0; left: -60%; width: 60%; height: 100%;
                      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
                      animation: annPreviewShimmer 2.8s ease-in-out infinite;
                    }
                    @keyframes annPreviewShimmer { 0% { left: -60%; } 100% { left: 130%; } }
                    .ann-preview-bounce-icon .ann-preview-icon { display: inline-block; animation: annPreviewBounce 1.2s ease-in-out infinite; }
                    @keyframes annPreviewBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
                    .ann-preview-gradient { background-size: 200% 200%; animation: annPreviewGradient 6s ease infinite; }
                    @keyframes annPreviewGradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                  `}</style>
                  <div
                    className={`rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 text-center ${animClass}`}
                    style={{
                      backgroundImage: isGradient ? `linear-gradient(270deg, ${barForm.bg_color}, ${shadeColor(barForm.bg_color, 45)}, ${barForm.bg_color})` : undefined,
                      backgroundColor: isGradient ? undefined : barForm.bg_color,
                      color: barForm.text_color,
                      fontFamily: getSiteFontFamily(barForm.font_family, customFonts) || FONT_FAMILY_MAP[barForm.font_family],
                      fontSize: barForm.font_size,
                      fontWeight: barForm.font_weight,
                      letterSpacing: LETTER_SPACING_MAP[barForm.letter_spacing]
                    }}
                  >
                    {preview.icon && <span className="ann-preview-icon">{preview.icon}</span>}
                    <span>{preview.message}</span>
                    {preview.link_text && <span className="underline font-semibold ml-1">{preview.link_text}</span>}
                  </div>
                </div>
              )
            })()}

            {/* Panel de Diseño */}
            <p className="text-xs font-semibold text-text-muted mb-2 mt-2">DISEÑO DE LA BARRA</p>

            <CollapsibleCard icon="palette" title="Colores" subtitle="Fondo y texto">
              <div className="grid sm:grid-cols-2 gap-5">
                <ColorPicker
                  label="Color de fondo"
                  value={barForm.bg_color}
                  onChange={(hex) => setBarForm({ ...barForm, bg_color: hex })}
                  palette={palette}
                />
                <ColorPicker
                  label="Color de texto"
                  value={barForm.text_color}
                  onChange={(hex) => setBarForm({ ...barForm, text_color: hex })}
                  palette={palette}
                />
              </div>
            </CollapsibleCard>

            <CollapsibleCard icon="type" title="Tipografía" subtitle="Fuente, tamaño y grosor" defaultOpen>
              <div className="grid sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-2">Tipografía</label>
                  <select
                    value={barForm.font_family}
                    onChange={(e) => setBarForm({ ...barForm, font_family: e.target.value })}
                    className="input"
                  >
                    <option value="default">Predeterminada (DM Sans)</option>
                    <option value="fira_sans">Fira Sans</option>
                    <option value="lora">Lora</option>
                    <option value="georgia">Georgia</option>
                    <option value="mono">Monoespaciada</option>
                    {customFonts.map(font => <option key={font.id} value={`custom:${font.id}`}>{font.name} (personalizada)</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-2">Grosor</label>
                  <select
                    value={barForm.font_weight}
                    onChange={(e) => setBarForm({ ...barForm, font_weight: e.target.value })}
                    className="input"
                  >
                    {FONT_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-2">
                    Tamaño de letra <span className="text-text-light font-normal">({barForm.font_size})</span>
                  </label>
                  <input
                    type="range"
                    min={11}
                    max={20}
                    value={parseInt(barForm.font_size)}
                    onChange={(e) => setBarForm({ ...barForm, font_size: `${e.target.value}px` })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-2">Espaciado entre letras</label>
                  <select
                    value={barForm.letter_spacing}
                    onChange={(e) => setBarForm({ ...barForm, letter_spacing: e.target.value })}
                    className="input"
                  >
                    <option value="normal">Normal</option>
                    <option value="wide">Amplio</option>
                    <option value="wider">Muy amplio</option>
                  </select>
                </div>
              </div>
            </CollapsibleCard>

            <CollapsibleCard icon="sparkles" title="Efecto visual" subtitle={barForm.animation === 'none' ? 'Ninguno' : barForm.animation}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { value: 'none', label: 'Ninguno' },
                  { value: 'pulse', label: 'Pulso suave' },
                  { value: 'shimmer', label: 'Brillo deslizante' },
                  { value: 'bounce-icon', label: 'Ícono rebotando' },
                  { value: 'gradient', label: 'Fondo animado' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBarForm({ ...barForm, animation: opt.value })}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                      barForm.animation === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-text-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </CollapsibleCard>

            <button
              onClick={saveBarSettings}
              disabled={savingBarSettings}
              className="btn btn-primary w-full max-w-2xl mb-8"
            >
              {savingBarSettings ? 'Guardando...' : 'Guardar Diseño'}
            </button>

            {announcements.length === 0 ? (
              <div className="card text-center py-12 text-text-muted max-w-2xl">
                <div className="mb-3 text-gray-300"><Icon name="megaphone" className="mx-auto h-10 w-10" /></div>
                <p className="font-medium">Todavía no hay mensajes</p>
                <p className="text-sm mt-1">Creá el primero para que aparezca arriba del header</p>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                {[...announcements].sort((a, b) => a.order_position - b.order_position).map((item, idx, arr) => (
                  <div key={item.id} className={`card flex items-center gap-4 ${!item.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveAnnouncement(item.id, 'up')}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200"
                      >▲</button>
                      <button
                        onClick={() => moveAnnouncement(item.id, 'down')}
                        disabled={idx === arr.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200"
                      >▼</button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text truncate">
                        {item.icon && <span className="mr-1">{item.icon}</span>}
                        {item.message}
                      </p>
                      {item.link_text && (
                        <p className="text-xs text-primary mt-1">{item.link_text} → {item.link_url}</p>
                      )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        onChange={() => toggleAnnouncementActive(item)}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                      <span className="text-xs font-semibold text-text-muted hidden sm:inline">Activo</span>
                    </label>

                    <button
                      onClick={() => openAnnouncementModal(item)}
                      className="px-3 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(item.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sections' && sectionView === 'fonts' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-xl mb-1">Biblioteca de tipografías</h3>
              <p className="text-sm text-text-muted">Subí una fuente una sola vez y aparecerá en los editores de hero, header, barra de anuncios, landing y footer.</p>
            </div>
            <div className="card space-y-4 max-w-2xl">
              <h4 className="font-bold text-text">Agregar una tipografía</h4>
              <p className="text-xs text-text-muted">Formatos admitidos: WOFF2, WOFF, TTF y OTF. Máximo 8 MB. Asegurate de tener permiso para usar el archivo.</p>
              <label className="block text-sm font-medium text-text-muted">Nombre para identificarla
                <input className="input mt-1" value={fontName} onChange={event => setFontName(event.target.value)} placeholder="Ej.: Montserrat" />
              </label>
              <input className="input" type="file" accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf" onChange={event => setFontFile(event.target.files?.[0] || null)} />
              {fontFile && <p className="text-xs text-text-muted">Seleccionada: {fontFile.name}</p>}
              <button type="button" onClick={uploadCustomFont} disabled={!fontFile || uploadingFont || !settings?.id} className="btn btn-primary w-full">{uploadingFont ? 'Subiendo tipografía…' : 'Subir y agregar a la biblioteca'}</button>
            </div>
            <div className="card max-w-2xl">
              <h4 className="mb-4 font-bold text-text">Tipografías disponibles</h4>
              {customFonts.length === 0 ? <p className="text-sm text-text-muted">Todavía no agregaste fuentes propias. Las fuentes incluidas siguen disponibles en los editores.</p> : <div className="space-y-3">
                {customFonts.map(font => <div key={font.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-text">{font.name}</span><span className="block truncate text-xs text-text-muted" style={{ fontFamily: getSiteFontFamily(`custom:${font.id}`) }}>Vista previa · Aa Bb 123</span></span>
                  <button type="button" onClick={() => deleteCustomFont(font)} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Eliminar</button>
                </div>)}
              </div>}
            </div>
          </div>
        )}

        {/* HEADER / MENÚ */}
        {activeTab === 'sections' && sectionView === 'header' && (() => {
          const sortedLinks = [...menuLinks].sort((a, b) => a.order_position - b.order_position)
          const activePreviewLinks = sortedLinks.filter(l => l.is_active)
          const heroPreview = headerPreviewMode === 'hero'
          const previewNavColors = headerNavigationColors(headerForm, heroPreview)
          const previewLogo = heroPreview ? logoForm.logo_transparent_url || logoForm.logo_url : logoForm.logo_url
          const previewBrandColor = heroPreview ? '#ffffff' : headerForm.text_color
          const LETTER_SPACING_MAP: Record<string, string> = { normal: 'normal', wide: '0.025em', wider: '0.05em' }

          return (
            <div>
              <h3 className="font-bold text-xl mb-1">Header / Menú</h3>
              <p className="text-sm text-text-muted mb-6">Logo, enlaces de navegación y estilo del encabezado del sitio</p>

              {/* Vista previa en vivo */}
              <div className="mb-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <p className="mr-2 text-xs font-semibold text-text-muted">VISTA PREVIA DE ESCRITORIO</p>
                  <button type="button" aria-pressed={heroPreview} onClick={() => setHeaderPreviewMode('hero')} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${heroPreview ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-muted'}`}>Inicio de la landing</button>
                  <button type="button" aria-pressed={!heroPreview} onClick={() => setHeaderPreviewMode('solid')} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${!heroPreview ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-muted'}`}>Sticky / Catálogo</button>
                </div>
                <div
                  className={`rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between ${headerForm.shadow ? 'shadow-md' : ''}`}
                  style={{ backgroundColor: heroPreview ? '#30281f' : '#ffffff', fontFamily: getSiteFontFamily(headerForm.font_family, customFonts) }}
                >
                  {logoForm.use_logo_image && previewLogo ? (
                    <img src={previewLogo} alt={logoForm.site_name} className="h-8 object-contain" />
                  ) : (
                    <div>
                      <p className="font-black text-lg" style={{ color: previewBrandColor, fontWeight: headerForm.brand_font_weight }}>{logoForm.site_name}</p>
                      <p className="text-[10px] font-semibold" style={{ color: previewBrandColor, opacity: 0.7, fontWeight: headerForm.brand_font_weight }}>{logoForm.site_tagline}</p>
                    </div>
                  )}
                  <div className="hidden sm:flex gap-5">
                    {activePreviewLinks.map((link, idx) => (
                      <span
                        key={link.id}
                        className={`relative pb-1 text-sm ${headerForm.nav_uppercase ? 'uppercase' : ''}`}
                        style={{
                          color: idx === 0 ? previewNavColors.active : previewNavColors.text,
                          letterSpacing: LETTER_SPACING_MAP[headerForm.nav_letter_spacing],
                          fontWeight: headerForm.nav_font_weight,
                          fontFamily: getSiteFontFamily(headerForm.nav_font_family || headerForm.font_family, customFonts)
                        }}
                      >
                        {headerForm.nav_show_icons && <Icon name={link.icon || defaultMenuIcon(link.url)} className="mr-1.5 inline h-4 w-4 align-[-2px]" />}
                        {link.label}
                        {headerForm.nav_underline && idx === 0 && (
                  <span className="absolute left-0 bottom-0 h-0.5 w-full rounded-full" style={{ backgroundColor: previewNavColors.active }} />
                        )}
                      </span>
                    ))}
                  </div>
          <div className="flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-bold" style={{ backgroundColor: headerForm.info_button_bg, color: headerForm.info_button_text, fontFamily: getSiteFontFamily(headerForm.info_font_family, customFonts) }}><Icon name={headerForm.info_button_icon || 'info'} className="h-3 w-3" />{headerForm.info_button_label || 'Info'}</div>
                </div>
              </div>

              {/* LOGO Y NOMBRE */}
              <CollapsibleCard icon="image" title="Logo y Nombre" subtitle={logoForm.use_logo_image ? 'Imagen' : logoForm.site_name}>
                <div className="flex gap-2 mb-5 p-1 bg-gray-100 rounded-xl w-fit">
                  <button
                    onClick={() => setLogoForm({ ...logoForm, use_logo_image: false })}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!logoForm.use_logo_image ? 'bg-white shadow text-text' : 'text-text-muted'}`}
                  >
                    Texto
                  </button>
                  <button
                    onClick={() => setLogoForm({ ...logoForm, use_logo_image: true })}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${logoForm.use_logo_image ? 'bg-white shadow text-text' : 'text-text-muted'}`}
                  >
                    Imagen
                  </button>
                </div>

                {logoForm.use_logo_image ? (
                  <div className="mb-5 space-y-5">
                    <p className="text-sm text-text-muted">Usá versiones preparadas para cada fondo: una clara para el header transparente y otra para el header blanco al desplazarte.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-border p-4">
                        <label className="mb-3 block text-sm font-semibold text-text">Logo para header transparente</label>
                        <div className="mb-3 flex h-20 items-center justify-center rounded-lg bg-gradient-to-r from-stone-800 to-amber-950 p-3">
                          {logoForm.logo_transparent_url ? <img src={logoForm.logo_transparent_url} alt="Logo para fondo transparente" className="max-h-full object-contain" style={{ width: `${logoForm.logo_width}px` }} /> : <span className="text-xs text-white/80">Usa el logo principal si no subís otro</span>}
                        </div>
                        <input type="file" accept="image/*" onChange={e => handleLogoUpload(e, 'transparent')} disabled={uploadingLogo} className="input" />
                        <label className="mt-4 block text-xs font-semibold text-text-muted">Ancho: {logoForm.logo_width} px</label>
                        <input type="range" min="60" max="320" step="4" value={logoForm.logo_width} onChange={e => setLogoForm({ ...logoForm, logo_width: Number(e.target.value) })} className="mt-2 w-full" />
                      </div>
                      <div className="rounded-xl border border-border p-4">
                        <label className="mb-3 block text-sm font-semibold text-text">Logo para header sólido / sticky</label>
                        <div className="mb-3 flex h-20 items-center justify-center rounded-lg border border-gray-200 bg-white p-3">
                          {logoForm.logo_url ? <img src={logoForm.logo_url} alt="Logo para fondo sólido" className="max-h-full object-contain" style={{ width: `${logoForm.logo_sticky_width}px` }} /> : <span className="text-xs text-text-muted">Subí el logo para fondo claro</span>}
                        </div>
                        <input type="file" accept="image/*" onChange={e => handleLogoUpload(e, 'standard')} disabled={uploadingLogo} className="input" />
                        <label className="mt-4 block text-xs font-semibold text-text-muted">Ancho: {logoForm.logo_sticky_width} px</label>
                        <input type="range" min="60" max="320" step="4" value={logoForm.logo_sticky_width} onChange={e => setLogoForm({ ...logoForm, logo_sticky_width: Number(e.target.value) })} className="mt-2 w-full" />
                      </div>
                    </div>
                    {uploadingLogo && <p className="text-xs text-text-muted">Subiendo logo...</p>}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-sm font-semibold text-text-muted mb-2">Nombre del sitio</label>
                      <input
                        type="text"
                        value={logoForm.site_name}
                        onChange={(e) => setLogoForm({ ...logoForm, site_name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-muted mb-2">Tagline</label>
                      <input
                        type="text"
                        value={logoForm.site_tagline}
                        onChange={(e) => setLogoForm({ ...logoForm, site_tagline: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                )}

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-text-muted mb-2">
                    Link del logo <span className="text-text-light font-normal">(a dónde va al hacer clic)</span>
                  </label>
                  <input
                    type="text"
                    value={logoForm.logo_link_url}
                    onChange={(e) => setLogoForm({ ...logoForm, logo_link_url: e.target.value })}
                    placeholder="/landing"
                    className="input"
                  />
                </div>

                <div className="mb-5 rounded-xl border border-border p-4">
                  <label className="mb-2 block text-sm font-semibold text-text">Favicon del sitio</label>
                  <p className="mb-3 text-xs text-text-muted">Es el icono pequeño que aparece en la pestaña del navegador. Recomendado: imagen cuadrada en PNG o SVG (32×32 o 64×64 px).</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-white p-2">
                      {logoForm.favicon_url ? <img src={logoForm.favicon_url} alt="Vista previa del favicon" className="h-full w-full object-contain" /> : <Icon name="image" className="h-6 w-6 text-text-muted" />}
                    </div>
                    <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-primary/40 px-4 py-3 text-sm font-semibold text-primary">
                      {uploadingLogo ? 'Subiendo…' : logoForm.favicon_url ? 'Reemplazar favicon' : 'Subir favicon'}
                      <input type="file" accept="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon" className="hidden" disabled={uploadingLogo} onChange={e => { void handleFaviconUpload(e.currentTarget.files?.[0]); e.currentTarget.value = '' }} />
                    </label>
                    {logoForm.favicon_url && <button type="button" onClick={removeFavicon} disabled={uploadingLogo} className="text-sm font-medium text-red-600 hover:underline">Quitar</button>}
                  </div>
                </div>

                <button onClick={saveLogo} disabled={savingLogo || uploadingLogo} className="btn btn-primary w-full">
                  {uploadingLogo ? 'Subiendo y guardando logo...' : savingLogo ? 'Guardando...' : 'Guardar Logo y Nombre'}
                </button>
              </CollapsibleCard>

              {/* ENLACES DE MENÚ */}
              <div className="card mb-4 max-w-2xl">
                <div className="flex justify-between items-center mb-5">
                  <h4 className="font-bold text-lg inline-flex items-center gap-2"><Icon name="link" className="h-5 w-5 text-primary" />Enlaces de Menú</h4>
                  <button
                    onClick={() => openMenuLinkModal()}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 text-sm whitespace-nowrap"
                  >
                    + Nuevo Enlace
                  </button>
                </div>

                {sortedLinks.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-6">Todavía no hay enlaces configurados</p>
                ) : (
                  <div className="space-y-3">
                    {sortedLinks.map((link, idx) => (
                      <div key={link.id} className={`flex items-center gap-3 p-3 rounded-lg border border-border ${!link.is_active ? 'opacity-50' : ''}`}>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveMenuLink(link.id, 'up')} disabled={idx === 0} className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200">▲</button>
                          <button onClick={() => moveMenuLink(link.id, 'down')} disabled={idx === sortedLinks.length - 1} className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200">▼</button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="inline-flex max-w-full items-center gap-2 font-semibold text-text truncate"><Icon name={link.icon || defaultMenuIcon(link.url)} className="h-4 w-4 shrink-0 text-text-muted" />{link.label}</p>
                          <p className="text-xs text-text-muted truncate">{link.url}</p>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={link.is_active} onChange={() => toggleMenuLinkActive(link)} className="w-5 h-5 rounded border-gray-300" />
                        </label>

                        <button onClick={() => openMenuLinkModal(link)} className="px-3 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20 text-sm">Editar</button>
                        <button onClick={() => deleteMenuLink(link.id)} className="px-3 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 text-sm">Eliminar</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ESTILO */}
              <CollapsibleCard icon="palette" title="Estilo del Header" subtitle="Colores y comportamiento">
                <div className="grid sm:grid-cols-2 gap-5 mb-5">
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 rounded-xl border border-border p-3">
                      <input
                        type="checkbox"
                        checked={headerForm.bg_color === 'transparent'}
                        onChange={(e) => setHeaderForm({ ...headerForm, bg_color: e.target.checked ? 'transparent' : '#ffffff' })}
                        className="mt-0.5 h-5 w-5 rounded border-gray-300"
                      />
                      <span>
                        <span className="block text-sm font-semibold">Fondo transparente</span>
                        <span className="mt-1 block text-xs text-text-muted">Deja visible lo que está detrás del header.</span>
                      </span>
                    </label>
                    {headerForm.bg_color !== 'transparent' && (
                      <ColorPicker label="Color de fondo" value={headerForm.bg_color} onChange={(hex) => setHeaderForm({ ...headerForm, bg_color: hex })} palette={palette} />
                    )}
                  </div>
                  <ColorPicker label="Nombre del sitio y botón del menú (header sólido)" value={headerForm.text_color} onChange={(hex) => setHeaderForm({ ...headerForm, text_color: hex })} palette={palette} />
                </div>
                <p className="mb-5 text-xs text-text-muted">Los colores de los enlaces se configuran en «Texto del menú», según el estado del header.</p>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={headerForm.sticky} onChange={(e) => setHeaderForm({ ...headerForm, sticky: e.target.checked })} className="w-5 h-5 rounded border-gray-300" />
                    <span className="font-semibold text-sm">Header fijo al hacer scroll (sticky)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={headerForm.shadow} onChange={(e) => setHeaderForm({ ...headerForm, shadow: e.target.checked })} className="w-5 h-5 rounded border-gray-300" />
                    <span className="font-semibold text-sm">Sombra debajo del header</span>
                  </label>
                </div>
              </CollapsibleCard>

              {/* TEXTO DEL MENÚ */}
              <CollapsibleCard
                icon="type"
                title="Texto del menú"
                subtitle={`${headerForm.nav_uppercase ? 'Mayúsculas' : 'Normal'}${headerForm.nav_underline ? ', subrayado' : ''}`}
                defaultOpen
              >
                <div className="flex flex-wrap gap-6 mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headerForm.nav_uppercase}
                      onChange={(e) => setHeaderForm({ ...headerForm, nav_uppercase: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300"
                    />
                    <span className="font-semibold text-sm">Mayúsculas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headerForm.nav_underline}
                      onChange={(e) => setHeaderForm({ ...headerForm, nav_underline: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300"
                    />
                    <span className="font-semibold text-sm">Subrayado en el link activo</span>
                  </label>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <label className="block text-sm font-semibold text-text-muted sm:col-span-2">Familia tipográfica del nombre del sitio
                    <select className="input mt-2" value={headerForm.font_family} onChange={e => setHeaderForm({ ...headerForm, font_family: e.target.value })}>
                      {BUILT_IN_FONT_OPTIONS.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}
                      {customFonts.map(font => <option key={font.id} value={`custom:${font.id}`}>{font.name} (personalizada)</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-text-muted sm:col-span-2">Familia tipográfica de los enlaces
                    <select className="input mt-2" value={headerForm.nav_font_family} onChange={e => setHeaderForm({ ...headerForm, nav_font_family: e.target.value })}>
                      {BUILT_IN_FONT_OPTIONS.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}
                      {customFonts.map(font => <option key={font.id} value={`custom:${font.id}`}>{font.name} (personalizada)</option>)}
                    </select>
                  </label>
                  <div className="sm:col-span-2"><h4 className="font-semibold">Escritorio: header sólido</h4><p className="mt-1 text-xs text-text-muted">Estos colores se usan en el catálogo y al bajar en la landing.</p></div>
                  <ColorPicker label="Enlaces en sticky / catálogo" value={headerForm.nav_text_color} onChange={hex => { setHeaderPreviewMode('solid'); setHeaderForm(current => ({ ...current, nav_text_color: hex })) }} palette={palette} />
                  <ColorPicker label="Enlace activo en sticky / catálogo" value={headerForm.nav_active_color} onChange={hex => { setHeaderPreviewMode('solid'); setHeaderForm(current => ({ ...current, nav_active_color: hex })) }} palette={palette} />
                  <div className="sm:col-span-2"><h4 className="font-semibold">Escritorio: sobre el hero</h4><p className="mt-1 text-xs text-text-muted">Estos colores se usan al inicio de la landing. El menú móvil tiene sus propios controles.</p></div>
                  <ColorPicker label="Enlaces al inicio de la landing" value={headerForm.nav_transparent_text_color} onChange={hex => { setHeaderPreviewMode('hero'); setHeaderForm(current => ({ ...current, nav_transparent_text_color: hex })) }} palette={palette} />
                  <ColorPicker label="Enlace activo al inicio de la landing" value={headerForm.nav_transparent_active_color} onChange={hex => { setHeaderPreviewMode('hero'); setHeaderForm(current => ({ ...current, nav_transparent_active_color: hex })) }} palette={palette} />
                  <label className="flex items-center gap-2 text-sm font-semibold text-text-muted sm:col-span-2">
                    <input type="checkbox" checked={headerForm.nav_show_icons} onChange={e => setHeaderForm({ ...headerForm, nav_show_icons: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                    Mostrar también los iconos junto a los enlaces en escritorio
                  </label>
                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2">Espaciado entre letras</label>
                    <select
                      value={headerForm.nav_letter_spacing}
                      onChange={(e) => setHeaderForm({ ...headerForm, nav_letter_spacing: e.target.value as typeof headerForm.nav_letter_spacing })}
                      className="input"
                    >
                      <option value="normal">Normal</option>
                      <option value="wide">Amplio</option>
                      <option value="wider">Muy amplio</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2">Grosor de los enlaces del menú</label>
                    <select
                      value={headerForm.nav_font_weight}
                      onChange={(e) => setHeaderForm({ ...headerForm, nav_font_weight: e.target.value })}
                      className="input"
                    >
                      {FONT_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                    </select>
                  </div>
                </div>
                <label className="mt-5 block max-w-sm text-sm font-semibold text-text-muted">Grosor del nombre del sitio
                  <select className="input mt-2" value={headerForm.brand_font_weight} onChange={e => setHeaderForm({ ...headerForm, brand_font_weight: Number(e.target.value) })}>
                    {FONT_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                  </select>
                </label>
              </CollapsibleCard>

              <CollapsibleCard icon="palette" title="Menú móvil y tablet" subtitle="Fondo y enlaces con colores propios, independientes del scroll" defaultOpen>
                <p className="mb-5 text-sm text-text-muted">Estos colores se usan en el menú que se abre con el botón de tres líneas. Se mantienen al inicio de la página y al desplazarte, tanto en la landing como en el catálogo.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {MOBILE_MENU_COLOR_FIELDS.map(([key, label]) => <ColorPicker key={key} label={label} value={headerForm.mobile_menu_settings[key]} onChange={color => setHeaderForm(current => ({ ...current, mobile_menu_settings: { ...current.mobile_menu_settings, [key]: color } }))} palette={palette} />)}
                </div>
                <div className="mt-6 rounded-2xl border border-border bg-gray-50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">Vista previa del menú desplegado</p>
                  <MobileMenuPanel
                    settings={headerForm.mobile_menu_settings}
                    links={menuLinks.filter(link => link.is_active).sort((a, b) => a.order_position - b.order_position).map((link, index) => ({ ...link, active: index === 0, icon: link.icon || defaultMenuIcon(link.url) }))}
                    fontFamily={getSiteFontFamily(headerForm.nav_font_family || headerForm.font_family)}
                    fontWeight={headerForm.nav_font_weight}
                    letterSpacing={{ normal: 'normal', wide: '0.025em', wider: '0.05em' }[headerForm.nav_letter_spacing]}
                    uppercase={headerForm.nav_uppercase}
                    preview
                  />
                  <p className="mt-3 text-xs text-text-muted">La tipografía y el grosor se toman de «Texto del menú». El bloque de datos del negocio usa los colores de «Pestaña Info».</p>
                </div>
              </CollapsibleCard>

              <CollapsibleCard icon="info" title="Pestaña Info" subtitle="Iconos, datos, tipografía y colores">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-text-muted">Texto del botón
                    <input className="input mt-2" value={headerForm.info_button_label} onChange={e => setHeaderForm({ ...headerForm, info_button_label: e.target.value })} />
                  </label>
                  <label className="block text-sm font-semibold text-text-muted">Título del panel
                    <input className="input mt-2" value={headerForm.info_title} onChange={e => setHeaderForm({ ...headerForm, info_title: e.target.value })} />
                  </label>
                  {([
                    ['info_button_icon', 'Icono del botón Info'],
                    ['info_phone_icon', 'Icono de teléfono'],
                    ['info_hours_icon', 'Icono de horarios'],
                    ['info_address_icon', 'Icono de dirección'],
                    ['info_email_icon', 'Icono de correo'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="block text-sm font-semibold text-text-muted">{label}
                      <span className="mt-2 flex items-center gap-2">
                        <Icon name={headerForm[key]} className="h-5 w-5 shrink-0 text-primary" />
                        <select className="input" value={headerForm[key]} onChange={e => setHeaderForm(current => ({ ...current, [key]: e.target.value as IconName }))}>
                          {HEADER_ICON_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </span>
                    </label>
                  ))}
                  <label className="block text-sm font-semibold text-text-muted">Tipografía de Info
                    <select className="input mt-2" value={headerForm.info_font_family} onChange={e => setHeaderForm({ ...headerForm, info_font_family: e.target.value })}>
                      {BUILT_IN_FONT_OPTIONS.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}
                      {customFonts.map(font => <option key={font.id} value={`custom:${font.id}`}>{font.name} (personalizada)</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-text-muted">Grosor del texto de Info
                    <select className="input mt-2" value={headerForm.info_font_weight} onChange={e => setHeaderForm({ ...headerForm, info_font_weight: e.target.value })}>
                      {FONT_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-text-muted">Grosor del título del panel
                    <select className="input mt-2" value={headerForm.info_title_font_weight} onChange={e => setHeaderForm({ ...headerForm, info_title_font_weight: e.target.value })}>
                      {FONT_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                    </select>
                  </label>
                  <ColorPicker label="Fondo del botón Info" value={headerForm.info_button_bg} onChange={hex => setHeaderForm({ ...headerForm, info_button_bg: hex })} palette={palette} />
                  <ColorPicker label="Texto e icono del botón Info" value={headerForm.info_button_text} onChange={hex => setHeaderForm({ ...headerForm, info_button_text: hex })} palette={palette} />
                  <ColorPicker label="Fondo del panel" value={headerForm.info_panel_bg} onChange={hex => setHeaderForm({ ...headerForm, info_panel_bg: hex })} palette={palette} />
                  <ColorPicker label="Borde del panel" value={headerForm.info_panel_border} onChange={hex => setHeaderForm({ ...headerForm, info_panel_border: hex })} palette={palette} />
                  <ColorPicker label="Título del panel" value={headerForm.info_title_color} onChange={hex => setHeaderForm({ ...headerForm, info_title_color: hex })} palette={palette} />
                  <ColorPicker label="Etiquetas (Teléfono, Horarios...)" value={headerForm.info_label_color} onChange={hex => setHeaderForm({ ...headerForm, info_label_color: hex })} palette={palette} />
                  <ColorPicker label="Datos y enlaces" value={headerForm.info_value_color} onChange={hex => setHeaderForm({ ...headerForm, info_value_color: hex })} palette={palette} />
                  <ColorPicker label="Enlaces al pasar el cursor" value={headerForm.info_hover_color} onChange={hex => setHeaderForm({ ...headerForm, info_hover_color: hex })} palette={palette} />
                  <ColorPicker label="Iconos de los datos" value={headerForm.info_icon_color} onChange={hex => setHeaderForm({ ...headerForm, info_icon_color: hex })} palette={palette} />
                </div>
              </CollapsibleCard>

              <button onClick={saveHeaderSettings} disabled={savingHeaderSettings} className="btn btn-primary w-full max-w-2xl">
                {savingHeaderSettings ? 'Guardando...' : 'Guardar Estilo'}
              </button>
            </div>
          )
        })()}
        {activeTab === 'sections' && sectionView === 'hero' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">Hero Slider</h3>
              <button
                onClick={() => openHeroModal()}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all"
              >
                + Nuevo Slide
              </button>
            </div>

            <div className="card mb-5">
              <h4 className="font-semibold text-text">Rotación automática</h4>
              <p className="mt-1 text-sm text-text-muted">Elegí cada cuántos segundos se muestra el siguiente hero.</p>
              <label className="mt-4 block max-w-xl text-sm font-medium text-text-muted">
                <span className="flex items-center justify-between"><span>Tiempo entre slides</span><strong className="text-text">{heroAutoplaySeconds} segundos</strong></span>
                <input type="range" min="2" max="15" step="1" value={heroAutoplaySeconds} onChange={e => setHeroAutoplaySeconds(Number(e.target.value))} className="mt-2 w-full" />
              </label>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" onClick={saveHeroAutoplaySettings} disabled={savingHeroAutoplay || !settings} className="btn btn-primary">
                  {savingHeroAutoplay ? 'Guardando…' : 'Guardar intervalo'}
                </button>
                {heroAutoplayMessage && <p role="status" className="text-sm text-text-muted">{heroAutoplayMessage}</p>}
              </div>
            </div>

            <div className="space-y-4">
              {heroSlides.map((hero, idx) => (
                <div key={hero.id} className="card">
                  <div className="flex gap-4">
                    {hero.image_url && (
                      <img
                        src={hero.image_url}
                        alt={hero.title || hero.internal_name || 'Hero'}
                        className="w-24 h-24 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="12" fill="%23999" text-anchor="middle" dominant-baseline="central"%3EError%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-text">{hero.internal_name || `Hero ${idx + 1}`}</h4>
                      <p className="text-sm text-text-muted">{hero.title || 'Sin título visible'}</p>
                      <p className="text-sm text-text-muted line-clamp-2">{hero.description}</p>
                      <p className="text-xs text-primary mt-2">{hero.cta_text}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openHeroModal(hero)}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteHeroSlide(hero.id)}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOQUES DE LANDING */}
        {activeTab === 'sections' && sectionView === 'landing' && (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-xl">Bloques de Landing</h3>
                <p className="mt-1 text-sm text-text-muted">Administrá los bloques informativos que aparecen debajo del hero.</p>
              </div>
              <button onClick={() => openSectionModal()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-primary/90">
                <span aria-hidden="true">+</span>Nuevo bloque
              </button>
            </div>

            {sections.length === 0 ? (
              <div className="card max-w-2xl py-10 text-center">
                <Icon name="document" className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                <p className="font-semibold text-text">Todavía no hay bloques</p>
                <p className="mt-1 text-sm text-text-muted">Creá uno para agregar contenido propio a la landing.</p>
              </div>
            ) : <div className="space-y-3">
              {sections.map(section => (
                <div key={section.id} className={`card !p-4 transition-opacity ${!section.is_visible ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    {section.image_url ? (
                      <img src={section.image_url} alt="" className="h-20 w-24 shrink-0 rounded-xl border border-border object-cover" />
                    ) : (
                      <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400"><Icon name="image" className="h-7 w-7" /></div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-text">{section.section_name}</h4>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{LANDING_BLOCK_LABELS[section.block_type] || LANDING_BLOCK_LABELS.content}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${section.is_visible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {section.is_visible ? 'Visible' : 'Oculto'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-text-muted">{section.title || 'Sin título'}</p>
                      {section.subtitle && <p className="text-sm text-text-muted">{section.subtitle}</p>}
                      {section.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{section.description}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      <div className="flex gap-1">
                        <button type="button" aria-label="Mover bloque hacia arriba" disabled={sections[0]?.id === section.id} onClick={() => void moveLandingSection(section, -1)} className="rounded-lg border border-border px-2.5 py-1.5 text-sm font-bold text-text-muted hover:bg-gray-50 disabled:opacity-40">↑</button>
                        <button type="button" aria-label="Mover bloque hacia abajo" disabled={sections[sections.length - 1]?.id === section.id} onClick={() => void moveLandingSection(section, 1)} className="rounded-lg border border-border px-2.5 py-1.5 text-sm font-bold text-text-muted hover:bg-gray-50 disabled:opacity-40">↓</button>
                      </div>
                      <button onClick={() => toggleLandingSection(section)} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-muted transition hover:bg-gray-50">
                        {section.is_visible ? 'Ocultar' : 'Mostrar'}
                      </button>
                      <button onClick={() => openSectionModal(section)} className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20">
                        Editar
                      </button>
                      <button onClick={() => void deleteLandingSection(section)} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>}
          </div>
        )}

        {/* POP-UPS */}
        {activeTab === 'sections' && sectionView === 'popups' && !showPopupModal && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-xl">Pop-ups</h3>
                <p className="text-sm text-text-muted">Ventanas emergentes: promos, newsletter, avisos, lo que necesites</p>
              </div>
              <button
                onClick={() => openPopupModal()}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all whitespace-nowrap"
              >
                + Nuevo Pop-up
              </button>
            </div>

            {popups.length === 0 ? (
              <div className="card text-center py-12 text-text-muted max-w-2xl">
                <div className="mb-3 text-gray-300"><Icon name="chat" className="mx-auto h-10 w-10" /></div>
                <p className="font-medium">Todavía no hay pop-ups</p>
                <p className="text-sm mt-1">Creá el primero con imagen propia o con el constructor</p>
              </div>
            ) : (
              <div className="space-y-3 max-w-2xl">
                {popups.map(popup => {
                  const triggers = [
                    popup.trigger_on_load && `Al cargar: ${popup.trigger_on_load_delay}s`,
                    popup.trigger_on_scroll && `Al desplazar: ${popup.trigger_on_scroll_percent}%`,
                    popup.trigger_on_exit && 'Al salir'
                  ].filter(Boolean)
                  const pages = [popup.show_on_landing && 'Landing', popup.show_on_catalogo && 'Catálogo'].filter(Boolean)

                  return (
                    <div key={popup.id} className={`card ${!popup.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-text">{popup.name}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                              {popup.content_mode === 'image' ? 'Imagen' : 'Constructor'}
                            </span>
                            {popup.shape === 'ticket' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700"><Icon name="ticket" className="h-3 w-3" />Ticket</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-xs text-text-muted">
                            {triggers.length > 0 ? triggers.map((t, i) => (
                              <span key={i} className="bg-gray-100 px-2 py-0.5 rounded-full">{t}</span>
                            )) : <span className="italic">Sin disparadores activos</span>}
                            <span className="text-border">|</span>
                            {pages.length > 0 ? pages.map((p, i) => (
                              <span key={i} className="bg-gray-100 px-2 py-0.5 rounded-full">{p}</span>
                            )) : <span className="italic">Sin páginas asignadas</span>}
                          </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                          <input type="checkbox" checked={popup.is_active} onChange={() => togglePopupActive(popup)} className="w-5 h-5 rounded border-gray-300" />
                        </label>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button onClick={() => openPopupModal(popup)} className="flex-1 px-3 py-2 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20 text-sm">Editar</button>
                        <button onClick={() => deletePopup(popup.id)} className="flex-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 text-sm">Eliminar</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Edición de pop-up: inline, igual que el resto de las secciones (no modal), para que la vista previa de la derecha lo muestre en vivo */}
        {activeTab === 'sections' && sectionView === 'popups' && showPopupModal && (
          <div>
            <button
              onClick={() => setShowPopupModal(false)}
              className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text mb-4"
            >
              ← Volver a la lista
            </button>

            <h3 className="font-bold text-xl mb-1">{editingPopup ? 'Editar Pop-up' : 'Nuevo Pop-up'}</h3>
            <p className="text-sm text-text-muted mb-6">Los cambios se ven en vivo en la vista previa de la derecha</p>

            <div className="space-y-4 mb-4 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Nombre interno *</label>
                <input
                  type="text"
                  value={popupForm.name}
                  onChange={(e) => setPopupForm({ ...popupForm, name: e.target.value })}
                  placeholder="Ej: Promo de verano"
                  className="input"
                />
                <p className="text-xs text-text-light mt-1">Solo para identificarlo acá en el admin, no se muestra a los visitantes.</p>
              </div>

              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setPopupForm({ ...popupForm, content_mode: 'builder' })}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${popupForm.content_mode === 'builder' ? 'bg-white shadow text-text' : 'text-text-muted'}`}
                >
                  Constructor
                </button>
                <button
                  type="button"
                  onClick={() => setPopupForm({ ...popupForm, content_mode: 'image' })}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${popupForm.content_mode === 'image' ? 'bg-white shadow text-text' : 'text-text-muted'}`}
                >
                  Imagen propia
                </button>
              </div>
            </div>

            {/* CONTENIDO */}
            {popupForm.content_mode === 'image' ? (
              <CollapsibleCard icon="image" title="Imagen" defaultOpen subtitle="Clickeable, con transparencia si el PNG la tiene">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2">Imagen del pop-up *</label>
                    {popupForm.clickable_image_url && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg inline-block">
                        <img src={popupForm.clickable_image_url} alt="Pop-up" className="h-32 object-contain" />
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleClickableImageUpload} disabled={uploadingClickableImage} className="input" />
                    {uploadingClickableImage && <p className="text-xs text-text-muted mt-2">Subiendo...</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2">Link al hacer clic (opcional)</label>
                    <input
                      type="text"
                      value={popupForm.clickable_image_link}
                      onChange={(e) => setPopupForm({ ...popupForm, clickable_image_link: e.target.value })}
                      placeholder="/catalogo"
                      className="input"
                    />
                    <CategoryDestinationSelect categories={landingCategories} value={popupForm.clickable_image_link} onChange={url => setPopupForm(current => ({ ...current, clickable_image_link: url }))} />
                    <ProductDestinationSelect products={landingProducts} value={popupForm.clickable_image_link} onChange={url => setPopupForm(current => ({ ...current, clickable_image_link: url }))} />
                  </div>
                </div>
              </CollapsibleCard>
            ) : (
              <CollapsibleCard icon="edit" title="Contenido" defaultOpen subtitle="Título, mensaje y botón">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2">Título</label>
                    <input
                      type="text"
                      value={popupForm.title}
                      onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })}
                      placeholder="Ej: ¡20% OFF hoy!"
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2">Mensaje</label>
                    <textarea
                      value={popupForm.message}
                      onChange={(e) => setPopupForm({ ...popupForm, message: e.target.value })}
                      placeholder="Ej: Válido solo por hoy en toda la tienda"
                      className="input"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2">Imagen decorativa (opcional)</label>
                    {popupForm.image_url && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg inline-block">
                        <img src={popupForm.image_url} alt="" className="h-24 object-contain" />
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handlePopupImageUpload} disabled={uploadingPopupImage} className="input" />
                    {uploadingPopupImage && <p className="text-xs text-text-muted mt-2">Subiendo...</p>}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-text-muted mb-2">Texto del botón</label>
                      <input
                        type="text"
                        value={popupForm.cta_text}
                        onChange={(e) => setPopupForm({ ...popupForm, cta_text: e.target.value })}
                        placeholder="Ver catálogo"
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-muted mb-2">Link del botón</label>
                      <input
                        type="text"
                        value={popupForm.cta_url}
                        onChange={(e) => setPopupForm({ ...popupForm, cta_url: e.target.value })}
                        placeholder="/catalogo"
                        className="input"
                      />
                      <CategoryDestinationSelect categories={landingCategories} value={popupForm.cta_url} onChange={url => setPopupForm(current => ({ ...current, cta_url: url }))} />
                      <ProductDestinationSelect products={landingProducts} value={popupForm.cta_url} onChange={url => setPopupForm(current => ({ ...current, cta_url: url }))} />
                    </div>
                  </div>
                </div>
              </CollapsibleCard>
            )}

            {/* DISEÑO (solo aplica al modo Constructor) */}
            {popupForm.content_mode === 'builder' && (
              <CollapsibleCard icon="palette" title="Diseño" subtitle="Colores, tipografía y peso del texto" defaultOpen>
                <div className="grid sm:grid-cols-2 gap-5">
                  <ColorPicker label="Fondo" value={popupForm.bg_color} onChange={(hex) => setPopupForm({ ...popupForm, bg_color: hex })} palette={palette} />
                  <ColorPicker label="Texto" value={popupForm.text_color} onChange={(hex) => setPopupForm({ ...popupForm, text_color: hex })} palette={palette} />
                  <ColorPicker label="Fondo del botón" value={popupForm.button_bg_color} onChange={(hex) => setPopupForm({ ...popupForm, button_bg_color: hex })} palette={palette} />
                  <ColorPicker label="Texto del botón" value={popupForm.button_text_color} onChange={(hex) => setPopupForm({ ...popupForm, button_text_color: hex })} palette={palette} />
                  <label className="block text-sm font-semibold text-text-muted sm:col-span-2">Familia tipográfica del pop-up
                    <select className="input mt-2" value={popupForm.font_family} onChange={e => setPopupForm({ ...popupForm, font_family: e.target.value })}>
                      {BUILT_IN_FONT_OPTIONS.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}
                      {customFonts.map(font => <option key={font.id} value={`custom:${font.id}`}>{font.name} (personalizada)</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold text-text-muted sm:col-span-2">Grosor del texto del pop-up
                    <select className="input mt-2" value={popupForm.font_weight} onChange={e => setPopupForm({ ...popupForm, font_weight: Number(e.target.value) })}>
                      {FONT_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                    </select>
                  </label>
                </div>
              </CollapsibleCard>
            )}

            {/* ESTILO DEL RECUADRO */}
            <CollapsibleCard icon="ticket" title="Estilo del recuadro" subtitle={popupForm.shape === 'ticket' ? 'Ticket / cupón' : 'Borde y forma'}>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-2">Forma</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setPopupForm({ ...popupForm, shape: 'rectangular' })}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${popupForm.shape === 'rectangular' ? 'bg-white shadow text-text' : 'text-text-muted'}`}
                    >
                      Rectangular
                    </button>
                    <button
                      type="button"
                      onClick={() => setPopupForm({ ...popupForm, shape: 'ticket' })}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${popupForm.shape === 'ticket' ? 'bg-white shadow text-text' : 'text-text-muted'}`}
                    >
                      <span className="inline-flex items-center gap-2"><Icon name="ticket" className="h-4 w-4" />Ticket / cupón</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-2">Borde</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 'none', label: 'Sin borde' },
                      { value: 'solid', label: 'Sólido' },
                      { value: 'dashed', label: 'Discontinuo' },
                      { value: 'dotted', label: 'Punteado' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPopupForm({ ...popupForm, border_style: opt.value as typeof popupForm.border_style })}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                          popupForm.border_style === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-muted'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {popupForm.border_style !== 'none' && (
                  <>
                    <ColorPicker label="Color del borde" value={popupForm.border_color} onChange={(hex) => setPopupForm({ ...popupForm, border_color: hex })} palette={palette} />

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-text-muted mb-2">
                          Grosor <span className="text-text-light font-normal">({popupForm.border_width}px)</span>
                        </label>
                        <input
                          type="range" min={1} max={10}
                          value={popupForm.border_width}
                          onChange={(e) => setPopupForm({ ...popupForm, border_width: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>

                      {popupForm.shape !== 'ticket' && (
                        <div>
                          <label className="block text-sm font-semibold text-text-muted mb-2">
                            Redondeado <span className="text-text-light font-normal">({popupForm.border_radius}px)</span>
                          </label>
                          <input
                            type="range" min={0} max={40}
                            value={popupForm.border_radius}
                            onChange={(e) => setPopupForm({ ...popupForm, border_radius: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>

                    {(popupForm.border_style === 'dashed' || popupForm.border_style === 'dotted') && (
                      <div className="grid sm:grid-cols-2 gap-5">
                        {popupForm.border_style === 'dashed' && (
                          <div>
                            <label className="block text-sm font-semibold text-text-muted mb-2">
                              Largo del guión <span className="text-text-light font-normal">({popupForm.dash_length}px)</span>
                            </label>
                            <input
                              type="range" min={2} max={30}
                              value={popupForm.dash_length}
                              onChange={(e) => setPopupForm({ ...popupForm, dash_length: parseInt(e.target.value) })}
                              className="w-full"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-semibold text-text-muted mb-2">
                            Separación <span className="text-text-light font-normal">({popupForm.dash_gap}px)</span>
                          </label>
                          <input
                            type="range" min={2} max={30}
                            value={popupForm.dash_gap}
                            onChange={(e) => setPopupForm({ ...popupForm, dash_gap: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CollapsibleCard>

            {/* DISPARADORES */}
            <CollapsibleCard icon="bolt" title="Disparadores" subtitle="Cuándo aparece (podés combinar varios)">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={popupForm.trigger_on_load}
                    onChange={(e) => setPopupForm({ ...popupForm, trigger_on_load: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 mt-0.5"
                  />
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 font-semibold text-sm"><Icon name="clock" className="h-4 w-4 text-primary" />Al cargar la página</label>
                    {popupForm.trigger_on_load && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={popupForm.trigger_on_load_delay}
                          onChange={(e) => setPopupForm({ ...popupForm, trigger_on_load_delay: parseInt(e.target.value) || 0 })}
                          className="input !w-20"
                        />
                        <span className="text-sm text-text-muted">segundos de espera</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={popupForm.trigger_on_scroll}
                    onChange={(e) => setPopupForm({ ...popupForm, trigger_on_scroll: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 mt-0.5"
                  />
                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 font-semibold text-sm"><Icon name="scroll" className="h-4 w-4 text-primary" />Al hacer scroll</label>
                    {popupForm.trigger_on_scroll && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={popupForm.trigger_on_scroll_percent}
                          onChange={(e) => setPopupForm({ ...popupForm, trigger_on_scroll_percent: parseInt(e.target.value) || 0 })}
                          className="input !w-20"
                        />
                        <span className="text-sm text-text-muted">% de la página</span>
                      </div>
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popupForm.trigger_on_exit}
                    onChange={(e) => setPopupForm({ ...popupForm, trigger_on_exit: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="inline-flex items-center gap-2 font-semibold text-sm"><Icon name="logout" className="h-4 w-4 text-primary" />Al intentar salir de la página (exit intent)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer pt-2 border-t border-border">
                  <input
                    type="checkbox"
                    checked={popupForm.show_once_per_session}
                    onChange={(e) => setPopupForm({ ...popupForm, show_once_per_session: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="font-semibold text-sm">Mostrar solo una vez por sesión</span>
                </label>
              </div>
            </CollapsibleCard>

            {/* PÁGINAS */}
            <CollapsibleCard icon="location" title="Páginas" subtitle={[popupForm.show_on_landing && 'Landing', popupForm.show_on_catalogo && 'Catálogo'].filter(Boolean).join(', ') || 'Ninguna seleccionada'}>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popupForm.show_on_landing}
                    onChange={(e) => setPopupForm({ ...popupForm, show_on_landing: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="font-semibold text-sm">Landing</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={popupForm.show_on_catalogo}
                    onChange={(e) => setPopupForm({ ...popupForm, show_on_catalogo: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="font-semibold text-sm">Catálogo</span>
                </label>
              </div>
            </CollapsibleCard>

            <label className="flex items-center gap-3 cursor-pointer mb-6 mt-2 max-w-2xl">
              <input
                type="checkbox"
                checked={popupForm.is_active}
                onChange={(e) => setPopupForm({ ...popupForm, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="font-semibold text-gray-700">Pop-up activo</span>
            </label>

            <div className="flex gap-3 max-w-2xl mb-8">
              <button onClick={() => setShowPopupModal(false)} className="btn btn-outline flex-1">Cancelar</button>
              <button onClick={savePopup} disabled={savingPopup} className="btn btn-primary flex-1">
                {savingPopup ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        {activeTab === 'sections' && sectionView === 'footer' && (
          <FooterEditor
            value={footerForm}
            onChange={setFooterForm}
            business={{ ...settings, site_name: logoForm.site_name }}
            customFonts={customFonts}
            palette={palette}
            saving={savingFooter}
            disabled={loading}
            message={footerMessage}
            onSave={saveFooter}
          />
        )}
      </div>

      {/* Panel de vista previa del sitio (solo desktop) */}
      <div className="hidden lg:block lg:col-span-4 sticky top-24 self-start">
        <SitePreviewPanel
          sectionView={activeTab === 'sections' ? sectionView : null}
          barForm={barForm}
          announcements={announcements}
          logoForm={logoForm}
          headerForm={headerForm}
          headerPreviewMode={headerPreviewMode}
          menuLinks={menuLinks}
          landingSections={sections}
          footerForm={footerForm}
          footerBusiness={{ ...settings, site_name: logoForm.site_name }}
          editingPopupForm={sectionView === 'popups' && showPopupModal ? popupForm : null}
          customFonts={customFonts}
        />
      </div>
      </div>

      {/* MODALS */}

      {/* Hero Modal */}
      {showHeroModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowHeroModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6">{editingHero ? 'Editar Slide' : 'Nuevo Slide'}</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Imagen para escritorio *</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-primary/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 transition-all"
                >
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full max-h-48 object-contain rounded-lg bg-stone-900 mx-auto"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E'
                        }}
                      />
                      <button 
                        type="button"
                        className="text-sm text-primary font-semibold"
                      >
                        Cambiar imagen
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-gray-400"><Icon name="image" className="mx-auto h-10 w-10" /></div>
                      <div className="text-sm font-semibold text-text">Haz clic para subir una imagen</div>
                      <div className="text-xs text-text-muted">JPG, PNG, WebP (máx 5MB)</div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <div className="mt-4 rounded-xl border border-border p-4">
                  <label className="block text-sm font-semibold text-text-muted">Imagen para móvil (opcional)</label>
                  <p className="mb-3 mt-1 text-xs text-text-muted">Si no subís una, se adapta la imagen de escritorio.</p>
                  {mobileHeroPreview && <img src={mobileHeroPreview} alt="Vista previa móvil del hero" className="mb-3 h-32 w-full rounded-lg bg-stone-900 object-contain" />}
                  <p className="mb-3 mt-1 text-xs text-text-muted">Para evitar pixelado, usá una imagen de al menos 1920 px de ancho para escritorio y 1080 px para móvil.</p>
                  <input ref={mobileHeroInputRef} type="file" accept="image/*" onChange={e => handleImageUpload(e, 'mobile')} className="input" disabled={uploadingImage} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(['desktop', 'mobile'] as const).map(device => {
                    const key = device === 'desktop' ? 'desktop_text_position' : 'mobile_text_position'
                    return <label key={key} className="block text-sm font-semibold text-text-muted">Texto en {device === 'desktop' ? 'escritorio' : 'móvil'}
                      <select className="input mt-2" value={heroForm[key]} onChange={e => setHeroForm(current => ({ ...current, [key]: e.target.value }))}>
                        <option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option>
                      </select>
                    </label>
                  })}
                  {(['desktop', 'mobile'] as const).map(device => {
                    const key = device === 'desktop' ? 'desktop_image_position' : 'mobile_image_position'
                    return <label key={key} className="block text-sm font-semibold text-text-muted">Encuadre en {device === 'desktop' ? 'escritorio' : 'móvil'}
                      <select className="input mt-2" value={heroForm[key]} onChange={e => setHeroForm(current => ({ ...current, [key]: e.target.value }))}>
                        <option value="center">Centro</option><option value="top">Arriba</option><option value="bottom">Abajo</option><option value="left">Izquierda</option><option value="right">Derecha</option>
                      </select>
                    </label>
                  })}
                  {(['desktop', 'mobile'] as const).map(device => {
                    const key = device === 'desktop' ? 'desktop_image_fit' : 'mobile_image_fit'
                    return <label key={key} className="block text-sm font-semibold text-text-muted">Ajuste de imagen en {device === 'desktop' ? 'escritorio' : 'móvil'}
                      <select className="input mt-2" value={heroForm[key]} onChange={e => setHeroForm(current => ({ ...current, [key]: e.target.value as 'cover' | 'contain' }))}>
                        <option value="contain">Mostrar completa (sin recortar)</option><option value="cover">Llenar el área (puede recortar)</option>
                      </select>
                    </label>
                  })}
                  <label className="block rounded-xl border border-border p-3 sm:col-span-2">
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                      <span>Oscurecer fondo del hero</span><span>{heroForm.image_darkness}%</span>
                    </span>
                    <span className="mt-1 block text-xs text-text-muted">Agrega una capa oscura sobre la imagen para que el texto destaque.</span>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="1"
                      value={heroForm.image_darkness}
                      onChange={e => setHeroForm(current => ({ ...current, image_darkness: Number(e.target.value) }))}
                      className="mt-2 w-full"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Nombre interno del hero *</label>
                <input
                  type="text"
                  value={heroForm.internal_name}
                  onChange={e => setHeroForm(current => ({ ...current, internal_name: e.target.value }))}
                  className="input"
                  placeholder="Ej: Hero de quesos"
                />
                <p className="mt-1 text-xs text-text-muted">Solo aparece en este editor para identificar el slide.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Título visible (opcional)</label>
                <input
                  type="text"
                  value={heroForm.title}
                  onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                  className="input"
                  placeholder="Ej: Los mejores productos"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Descripción</label>
                <textarea
                  value={heroForm.description}
                  onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                  className="input min-h-24"
                  placeholder="Describe el contenido del slide"
                />
              </div>

              <div className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
                <p className="text-sm font-semibold text-text sm:col-span-2">Visibilidad del texto por dispositivo</p>
                {([
                  { label: 'Título', mobile: 'show_title_mobile', desktop: 'show_title_desktop' },
                  { label: 'Descripción', mobile: 'show_description_mobile', desktop: 'show_description_desktop' }
                ] as const).map(item => (
                  <fieldset key={item.label} className="rounded-lg border border-border p-3">
                    <legend className="px-1 text-sm font-semibold text-text">{item.label}</legend>
                    <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
                      {([
                        { key: item.mobile, label: 'Celular' },
                        { key: item.desktop, label: 'Computadora' }
                      ] as const).map(option => (
                        <label key={option.key} className="flex items-center gap-2 text-sm text-text-muted">
                          <input type="checkbox" checked={heroForm[option.key]} onChange={e => setHeroForm(current => ({ ...current, [option.key]: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>

              <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
                <p className="text-sm font-semibold text-text sm:col-span-2">Tipografía del hero</p>
                <label className="block text-sm font-medium text-text-muted">Título
                  <select className="input mt-1" value={heroForm.title_font} onChange={e => setHeroForm(current => ({ ...current, title_font: e.target.value }))}>
                    <option value="lora">Lora (recomendada)</option><option value="dm_sans">DM Sans</option><option value="fira_sans">Fira Sans</option><option value="georgia">Georgia</option>{customFonts.map(font => <option key={font.id} value={`custom:${font.id}`}>{font.name} (personalizada)</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-text-muted">Descripción y botón
                  <select className="input mt-1" value={heroForm.body_font} onChange={e => setHeroForm(current => ({ ...current, body_font: e.target.value }))}>
                    <option value="dm_sans">DM Sans (recomendada)</option><option value="fira_sans">Fira Sans</option><option value="lora">Lora</option><option value="georgia">Georgia</option>{customFonts.map(font => <option key={font.id} value={`custom:${font.id}`}>{font.name} (personalizada)</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-text-muted">Grosor del título
                  <select className="input mt-1" value={heroForm.title_font_weight} onChange={e => setHeroForm(current => ({ ...current, title_font_weight: Number(e.target.value) }))}>
                    {FONT_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-text-muted">Grosor de la descripción y el botón
                  <select className="input mt-1" value={heroForm.body_font_weight} onChange={e => setHeroForm(current => ({ ...current, body_font_weight: Number(e.target.value) }))}>
                    {FONT_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
                <p className="text-sm font-semibold text-text sm:col-span-2">Tamaño del texto (px)</p>
                {([
                  ['title_size_mobile', 'Título en móvil', 28, 64],
                  ['title_size_desktop', 'Título en escritorio', 36, 96],
                  ['body_size_mobile', 'Descripción en móvil', 14, 32],
                  ['body_size_desktop', 'Descripción en escritorio', 16, 40],
                ] as const).map(([key, label, min, max]) => (
                  <label key={key} className="block text-sm font-medium text-text-muted">
                    <span className="flex items-center justify-between gap-2"><span>{label}</span><strong className="text-text">{heroForm[key]} px</strong></span>
                    <input type="range" min={min} max={max} step={1} value={heroForm[key]} onChange={e => setHeroForm(current => ({ ...current, [key]: Number(e.target.value) }))} className="mt-2 w-full" />
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Botón - Texto</label>
                <input
                  type="text"
                  value={heroForm.cta_text}
                  onChange={(e) => setHeroForm({ ...heroForm, cta_text: e.target.value })}
                  placeholder="Ver Catálogo"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Botón - URL</label>
                <input
                  type="text"
                  value={heroForm.cta_url}
                  onChange={(e) => setHeroForm({ ...heroForm, cta_url: e.target.value })}
                  placeholder="/catalogo"
                  className="input"
                />
                <CategoryDestinationSelect
                  categories={landingCategories}
                  value={heroForm.cta_url}
                  onChange={url => setHeroForm(current => ({ ...current, cta_url: url }))}
                />
                <ProductDestinationSelect products={landingProducts} value={heroForm.cta_url} onChange={url => setHeroForm(current => ({ ...current, cta_url: url }))} />
              </div>

              <div className="rounded-xl border border-border p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={heroForm.cta_bottom_offset !== null}
                    onChange={e => setHeroForm(current => ({ ...current, cta_bottom_offset: e.target.checked ? 30 : null }))}
                    className="mt-0.5 h-5 w-5 rounded border-gray-300"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-text">Fijar botón cerca del borde inferior</span>
                    <span className="mt-1 block text-xs text-text-muted">Si está desactivado, el botón queda debajo de la descripción.</span>
                  </span>
                </label>
                {heroForm.cta_bottom_offset !== null && (
                  <label className="mt-4 block text-sm font-medium text-text-muted">
                    <span className="flex items-center justify-between gap-2"><span>Distancia desde abajo</span><strong className="text-text">{heroForm.cta_bottom_offset} px</strong></span>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      step="1"
                      value={heroForm.cta_bottom_offset}
                      onChange={e => setHeroForm(current => ({ ...current, cta_bottom_offset: Number(e.target.value) }))}
                      className="mt-2 w-full"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowHeroModal(false)} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button 
                onClick={saveHeroSlide} 
                disabled={savingHero || uploadingImage} 
                className="btn btn-primary flex-1"
              >
                {savingHero ? 'Guardando...' : uploadingImage ? 'Subiendo...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowSectionModal(false)}>
          <div className={`bg-surface w-full ${sectionForm.block_type === 'location_map' ? 'max-w-3xl' : 'max-w-lg'} rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto`} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6">{editingSection ? 'Editar bloque' : 'Nuevo bloque de landing'}</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Nombre interno *</label>
                <input
                  type="text"
                  value={sectionForm.section_name}
                  onChange={(e) => setSectionForm({ ...sectionForm, section_name: e.target.value })}
                  placeholder="Ej.: Quiénes somos"
                  className="input"
                />
                <p className="mt-1 text-xs text-text-muted">Se usa para identificar este bloque en el editor.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Tipo de sección</label>
                <select
                  value={sectionForm.block_type}
                  onChange={(e) => {
                    const block_type = e.target.value as LandingBlockType
                    const instructionContent = block_type === 'order_instructions' ? ORDER_INSTRUCTIONS_CONTENT : block_type === 'saved_lists_instructions' ? SAVED_LISTS_INSTRUCTIONS_CONTENT : null
                    setSectionForm(current => ({
                      ...current,
                      ...(instructionContent ? {
                        section_name: current.section_name || instructionContent.section_name,
                        title: current.title || instructionContent.title,
                        description: current.description || instructionContent.description,
                      } : {}),
                      block_type,
                      settings: defaultLandingSettings(block_type),
                    }))
                  }}
                  className="input"
                >
                  {Object.entries(LANDING_BLOCK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <p className="mt-1 text-xs text-text-muted">El tipo define cómo se presenta este bloque en la landing.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Título *</label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Subtítulo</label>
                <input
                  type="text"
                  value={sectionForm.subtitle}
                  onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Descripción</label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  className="input min-h-24"
                />
              </div>

              <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
                <p className="text-sm font-semibold text-text sm:col-span-2">Tipografía de esta sección</p>
                <label className="block text-sm font-medium text-text-muted">Títulos
                  <select className="input mt-1" value={sectionForm.settings.heading_font || 'inherit'} onChange={e => updateLandingSettings({ heading_font: e.target.value as LandingSectionSettings['heading_font'] })}>
                    <option value="inherit">Estilo actual</option><option value="lora">Lora (recomendada, cálida)</option><option value="dm_sans">DM Sans</option><option value="fira_sans">Fira Sans</option><option value="georgia">Georgia</option>{customFonts.map(font => <option key={font.id} value={`custom:${font.id}`}>{font.name} (personalizada)</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-text-muted">Grosor de títulos
                  <select className="input mt-1" value={sectionForm.settings.heading_weight || '700'} onChange={e => updateLandingSettings({ heading_weight: e.target.value })}>
                    {FONT_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-text-muted">Texto y descripciones
                  <select className="input mt-1" value={sectionForm.settings.body_font || 'inherit'} onChange={e => updateLandingSettings({ body_font: e.target.value as LandingSectionSettings['body_font'] })}>
                    <option value="inherit">Estilo actual</option><option value="dm_sans">DM Sans (recomendada, legible)</option><option value="fira_sans">Fira Sans</option><option value="lora">Lora</option><option value="georgia">Georgia</option>{customFonts.map(font => <option key={font.id} value={`custom:${font.id}`}>{font.name} (personalizada)</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-text-muted">Grosor del texto
                  <select className="input mt-1" value={sectionForm.settings.body_weight || '400'} onChange={e => updateLandingSettings({ body_weight: e.target.value })}>
                    {FONT_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                  </select>
                </label>
                <p className="text-xs text-text-muted sm:col-span-2">Sugerencia para el estilo del local: Lora en títulos y DM Sans en textos.</p>
                <p className="text-sm font-semibold text-text sm:col-span-2">{sectionForm.block_type === 'location_map' ? 'Alineación del encabezado por dispositivo' : 'Alineación del texto por dispositivo'}</p>
                {(['desktop', 'mobile'] as const).map(device => {
                  const key = device === 'desktop' ? 'desktop_text_alignment' : 'mobile_text_alignment'
                  return <label key={key} className="block text-sm font-medium text-text-muted">{device === 'desktop' ? 'Escritorio' : 'Móvil'}
                    <select className="input mt-1" value={sectionForm.settings[key] || 'inherit'} onChange={e => updateLandingSettings({ [key]: e.target.value as LandingSectionSettings[typeof key] })}>
                      <option value="inherit">Diseño actual</option><option value="left">Izquierda</option><option value="center">Centro</option><option value="right">Derecha</option>
                    </select>
                  </label>
                })}
                {sectionForm.block_type !== 'location_map' && <>
                <p className="text-sm font-semibold text-text sm:col-span-2">Encuadre de imágenes por dispositivo</p>
                {(['desktop', 'mobile'] as const).map(device => {
                  const key = device === 'desktop' ? 'desktop_image_position' : 'mobile_image_position'
                  return <label key={key} className="block text-sm font-medium text-text-muted">{device === 'desktop' ? 'Escritorio' : 'Móvil'}
                    <select className="input mt-1" value={sectionForm.settings[key] || 'center'} onChange={e => updateLandingSettings({ [key]: e.target.value as LandingSectionSettings[typeof key] })}>
                      <option value="center">Centro</option><option value="top">Arriba</option><option value="bottom">Abajo</option><option value="left">Izquierda</option><option value="right">Derecha</option>
                    </select>
                  </label>
                })}
                <label className="block text-sm font-medium text-text-muted">Posición de imagen en escritorio
                  <select className="input mt-1" value={sectionForm.settings.desktop_image_side || 'current'} onChange={e => updateLandingSettings({ desktop_image_side: e.target.value === 'current' ? undefined : e.target.value as 'left' | 'right' })}>
                    <option value="current">Diseño actual</option><option value="left">A la izquierda del texto</option><option value="right">A la derecha del texto</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-text-muted">Orden en móvil
                  <select className="input mt-1" value={sectionForm.settings.mobile_image_order || 'first'} onChange={e => updateLandingSettings({ mobile_image_order: e.target.value as 'first' | 'last' })}>
                    <option value="first">Imagen antes del texto</option><option value="last">Imagen después del texto</option>
                  </select>
                </label>
                </>}
              </div>

              {sectionForm.block_type === 'categories' && (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <CollapsibleCard icon="palette" title="Encabezado y colores del bloque" subtitle="Tonos crema y oliva, con títulos y tarjetas personalizables" defaultOpen>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-text-muted">Etiqueta sobre el título
                        <input className="input mt-1" value={sectionForm.settings.category_eyebrow ?? CATEGORY_APPEARANCE_DEFAULTS.category_eyebrow} onChange={e => updateLandingSettings({ category_eyebrow: e.target.value })} placeholder="Nuestro catálogo" />
                      </label>
                      <p className="text-xs text-text-muted">Dejala vacía para ocultarla. El título, subtítulo y descripción se editan en los campos generales de este bloque.</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {(['mobile', 'desktop'] as const).map(device => {
                          const key = device === 'mobile' ? 'category_title_size_mobile' : 'category_title_size_desktop'
                          const size = sectionForm.settings[key] ?? CATEGORY_APPEARANCE_DEFAULTS[key]
                          return <label key={key} className="block text-sm font-medium text-text-muted">Título en {device === 'mobile' ? 'móvil' : 'escritorio'}: {size} px
                            <input type="range" min="22" max={device === 'mobile' ? 60 : 80} value={size} onChange={e => updateLandingSettings({ [key]: Number(e.target.value) })} className="mt-2 w-full" />
                          </label>
                        })}
                        {CATEGORY_APPEARANCE_COLORS.map(([key, label]) => <ColorPicker key={key} label={label} value={sectionForm.settings[key] || CATEGORY_APPEARANCE_DEFAULTS[key]} onChange={color => updateLandingSettings({ [key]: color })} palette={palette} />)}
                      </div>
                      <p className="text-xs text-text-muted">En tablet, el título usa un tamaño intermedio. Los colores al pasar el cursor también se muestran al enfocar una tarjeta con el teclado.</p>
                    </div>
                  </CollapsibleCard>
                  <div>
                    <h4 className="font-semibold text-text">Tamaño y colores de los iconos</h4>
                    <p className="mt-1 text-xs text-text-muted">Los colores también se aplican a los SVG y PNG personalizados como una silueta. Usá archivos con fondo transparente.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(['desktop', 'mobile'] as const).map(device => {
                      const key = device === 'desktop' ? 'category_icon_size_desktop' : 'category_icon_size_mobile'
                      const size = sectionForm.settings[key] ?? (device === 'desktop' ? 44 : 44)
                      return <label key={key} className="block text-sm font-medium text-text-muted">Tamaño en {device === 'desktop' ? 'escritorio' : 'móvil'}: {size} px
                        <input type="range" min="28" max={device === 'desktop' ? 160 : 136} step="2" value={size} onChange={e => updateLandingSettings({ [key]: Number(e.target.value) })} className="mt-2 w-full" />
                      </label>
                    })}
                    <label className="block text-sm font-medium text-text-muted sm:col-span-2">Grosor del icono personalizado: {sectionForm.settings.category_custom_icon_weight ?? 0} px
                      <input type="range" min="0" max="6" step="1" value={sectionForm.settings.category_custom_icon_weight ?? 0} onChange={e => updateLandingSettings({ category_custom_icon_weight: Number(e.target.value) })} className="mt-2 w-full" />
                    </label>
                    {([
                      ['category_icon_bg_color', 'Fondo normal', '#f2e9e3'],
                      ['category_icon_color', 'Icono normal', '#8b4a2f'],
                      ['category_icon_hover_bg_color', 'Fondo al pasar el cursor', '#8b4a2f'],
                      ['category_icon_hover_color', 'Icono al pasar el cursor', '#ffffff'],
                    ] as const).map(([key, label, fallback]) => <label key={key} className="flex items-center gap-3 text-sm font-medium text-text-muted">
                      <input type="color" value={sectionForm.settings[key] || fallback} onChange={e => updateLandingSettings({ [key]: e.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-1" />
                      <span>{label}</span>
                    </label>)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-text">Categorías que se mostrarán y su orden</h4>
                    <p className="mt-1 text-xs text-text-muted">Podés incluir categorías principales y subcategorías. Usá las flechas para ordenar las tarjetas.</p>
                  </div>
                  {(() => {
                    const availableCategories = landingCategories.filter(category => category.show_in_catalog !== false)
                    const defaultOrder = availableCategories.filter(category => !category.parent_id).map(category => category.id)
                    const selectedOrder = sectionForm.settings.category_order ?? defaultOrder
                    const toggleCategory = (categoryId: string, checked: boolean) => {
                      const nextOrder = checked ? [...selectedOrder, categoryId] : selectedOrder.filter(id => id !== categoryId)
                      updateLandingSettings({ category_order: nextOrder })
                    }
                    const moveCategory = (categoryId: string, direction: -1 | 1) => {
                      const index = selectedOrder.indexOf(categoryId)
                      const targetIndex = index + direction
                      if (index < 0 || targetIndex < 0 || targetIndex >= selectedOrder.length) return
                      const nextOrder = [...selectedOrder]
                      ;[nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]]
                      updateLandingSettings({ category_order: nextOrder })
                    }
                    return <>
                      <div className="space-y-2">
                        {availableCategories.filter(category => !category.parent_id).map(category => {
                          const children = availableCategories.filter(child => child.parent_id === category.id)
                          return <div key={category.id} className="rounded-lg border border-border bg-white p-2">
                            <label className="flex cursor-pointer items-center gap-2 px-1 py-1 text-sm font-medium">
                              <input type="checkbox" checked={selectedOrder.includes(category.id)} onChange={event => toggleCategory(category.id, event.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                              <span className="min-w-0 flex-1 truncate">{category.name}</span>
                            </label>
                            {children.length > 0 && <details className="group mt-1 border-t border-gray-100 pt-1">
                              <summary className="flex cursor-pointer list-none items-center gap-2 px-1 py-1 text-xs font-medium text-text-muted [&::-webkit-details-marker]:hidden">
                                <span className="transition-transform group-open:rotate-90">›</span>
                                Ver subcategorías ({children.length})
                              </summary>
                              <div className="mt-1 space-y-1 pl-5">
                                {children.map(child => <label key={child.id} className="flex cursor-pointer items-center gap-2 rounded-md bg-gray-50 px-2 py-2 text-sm">
                                  <input type="checkbox" checked={selectedOrder.includes(child.id)} onChange={event => toggleCategory(child.id, event.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                                  <span className="min-w-0 truncate">{child.name}</span>
                                  {selectedOrder.includes(child.id) && <span className="ml-auto text-[10px] uppercase tracking-wide text-text-muted">Incluida</span>}
                                </label>)}
                              </div>
                            </details>}
                          </div>
                        })}
                      </div>
                      <div className="space-y-1">
                        {selectedOrder.map((categoryId, index) => {
                          const category = availableCategories.find(item => item.id === categoryId)
                          if (!category) return null
                          return <div key={categoryId} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                            <span className="w-6 text-center font-semibold text-text-muted">{index + 1}</span>
                            <span className="min-w-0 flex-1 truncate">{category.parent_id ? '↳ ' : ''}{category.name}</span>
                            <button type="button" aria-label={`Subir ${category.name}`} disabled={index === 0} onClick={() => moveCategory(categoryId, -1)} className="rounded border border-border px-2 py-1 disabled:opacity-40">↑</button>
                            <button type="button" aria-label={`Bajar ${category.name}`} disabled={index === selectedOrder.length - 1} onClick={() => moveCategory(categoryId, 1)} className="rounded border border-border px-2 py-1 disabled:opacity-40">↓</button>
                          </div>
                        })}
                        {selectedOrder.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Elegí al menos una categoría para mostrar en este bloque.</p>}
                      </div>
                    </>
                  })()}
                  <div>
                    <h4 className="font-semibold text-text">Icono para cada categoría</h4>
                    <p className="mt-1 text-xs text-text-muted">Subí un SVG o PNG propio, o elegí uno de los iconos disponibles. Si no personalizás, se sugiere automáticamente según el nombre.</p>
                  </div>
                  {(sectionForm.settings.category_order ?? landingCategories.filter(category => !category.parent_id && category.show_in_catalog !== false).map(category => category.id))
                    .map(categoryId => landingCategories.find(category => category.id === categoryId && category.show_in_catalog !== false))
                    .filter((category): category is EditableLandingCategory => Boolean(category))
                    .map(category => {
                    const customIcon = sectionForm.settings.category_icons?.[category.id] || ''
                    const selectedIcon = getCategoryIconName(category.name, customIcon)
                    const customImage = isCategoryIconImage(customIcon) ? customIcon : ''
                    return (
                      <div key={category.id} className="grid items-center gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="category-icon-container flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                            style={{
                              '--category-icon-bg': sectionForm.settings.category_icon_bg_color || '#f2e9e3',
                              '--category-icon-color': sectionForm.settings.category_icon_color || '#8b4a2f',
                              '--category-icon-hover-bg': sectionForm.settings.category_icon_hover_bg_color || '#8b4a2f',
                              '--category-icon-hover-color': sectionForm.settings.category_icon_hover_color || '#ffffff',
                              '--category-custom-icon-expansion': `${(sectionForm.settings.category_custom_icon_weight || 0) / 2}px`,
                            } as React.CSSProperties}
                          >
                            {customImage ? <CategoryIconImage src={customImage} weight={sectionForm.settings.category_custom_icon_weight || 0} /> : <Icon name={selectedIcon} className="h-5 w-5" />}
                          </span>
                          <span className="truncate text-sm font-semibold text-text">{category.name}</span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <select
                            aria-label={`Icono predeterminado para ${category.name}`}
                            className="input"
                            value={customImage ? '' : customIcon}
                            onChange={e => setSectionForm(current => ({ ...current, settings: { ...current.settings, category_icons: { ...(current.settings.category_icons || {}), [category.id]: e.target.value } } }))}
                          >
                            <option value="">Sugerido automáticamente</option>
                            {CATEGORY_ICON_OPTIONS.map(option => <option key={option.name} value={option.name}>{option.label}</option>)}
                          </select>
                          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-primary/40 px-3 py-2 text-center text-sm font-semibold text-primary">
                            {uploadingImage ? 'Subiendo…' : customImage ? 'Reemplazar icono' : 'Subir SVG o PNG'}
                            <input
                              type="file"
                              accept="image/svg+xml,image/png"
                              className="hidden"
                              disabled={uploadingImage}
                              onChange={e => {
                                const file = e.currentTarget.files?.[0]
                                void uploadLandingAsset(file, url => setSectionForm(current => ({
                                  ...current,
                                  settings: { ...current.settings, category_icons: { ...(current.settings.category_icons || {}), [category.id]: url } }
                                })), 'category-icon')
                                e.currentTarget.value = ''
                              }}
                            />
                          </label>
                          {customImage && <button type="button" className="text-xs font-medium text-red-600 hover:underline sm:col-span-2 sm:justify-self-start" onClick={() => setSectionForm(current => ({
                            ...current,
                            settings: { ...current.settings, category_icons: { ...(current.settings.category_icons || {}), [category.id]: '' } }
                          }))}>Quitar imagen y usar icono sugerido</button>}
                        </div>
                      </div>
                    )
                  })}
                  {(sectionForm.settings.category_order ?? landingCategories.filter(category => !category.parent_id && category.show_in_catalog !== false).map(category => category.id)).length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Seleccioná categorías para configurar sus iconos.</p>}
                </div>
              )}

              {sectionForm.block_type === 'banner' && (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <h4 className="font-semibold text-text">Botón y estilo del banner</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><label className="mb-1 block text-xs font-medium text-text-muted">Texto del botón</label><input className="input" value={sectionForm.settings.button_text || ''} onChange={e => updateLandingSettings({ button_text: e.target.value })} placeholder="Ver catálogo" /></div>
                    <div><label className="mb-1 block text-xs font-medium text-text-muted">Enlace del botón</label><input className="input" value={sectionForm.settings.button_url || ''} onChange={e => updateLandingSettings({ button_url: e.target.value })} placeholder="/catalogo" /><CategoryDestinationSelect categories={landingCategories} value={sectionForm.settings.button_url || ''} onChange={url => updateLandingSettings({ button_url: url })} /><ProductDestinationSelect products={landingProducts} value={sectionForm.settings.button_url || ''} onChange={url => updateLandingSettings({ button_url: url })} /></div>
                  </div>
                  <div><label className="mb-1 block text-xs font-medium text-text-muted">Color de fondo</label><input type="color" className="h-11 w-full cursor-pointer rounded-lg border border-border p-1" value={sectionForm.settings.background_color || '#fff7ed'} onChange={e => updateLandingSettings({ background_color: e.target.value })} /></div>
                </div>
              )}

              {sectionForm.block_type === 'feature_cards' && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-text">Tarjetas destacadas</h4>
                  {(sectionForm.settings.cards || []).map((card, index) => (
                    <div key={index} className="space-y-3 rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between"><h5 className="font-semibold">Tarjeta {index + 1}</h5><button type="button" onClick={() => updateLandingSettings({ cards: (sectionForm.settings.cards || []).filter((_, i) => i !== index) })} className="text-sm font-semibold text-red-600">Quitar</button></div>
                      <input className="input" value={card.title} onChange={e => updateLandingCard(index, { title: e.target.value })} placeholder="Título" />
                      <textarea className="input min-h-20" value={card.description} onChange={e => updateLandingCard(index, { description: e.target.value })} placeholder="Descripción" />
                      <div className="grid gap-2 sm:grid-cols-2"><input className="input" value={card.image_url} onChange={e => updateLandingCard(index, { image_url: e.target.value })} placeholder="URL de la imagen" /><label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-primary/40 px-3 py-2 text-sm font-semibold text-primary">{uploadingImage ? 'Subiendo…' : 'Subir imagen'}<input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={e => { void uploadLandingAsset(e.target.files?.[0], url => updateLandingCard(index, { image_url: url })); e.currentTarget.value = '' }} /></label></div>
                      <div className="grid gap-2 sm:grid-cols-2"><input className="input" value={card.mobile_image_url || ''} onChange={e => updateLandingCard(index, { mobile_image_url: e.target.value })} placeholder="URL de imagen para móvil (opcional)" /><label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-primary/40 px-3 py-2 text-sm font-semibold text-primary">{uploadingImage ? 'Subiendo…' : 'Subir imagen móvil'}<input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={e => { void uploadLandingAsset(e.target.files?.[0], url => updateLandingCard(index, { mobile_image_url: url })); e.currentTarget.value = '' }} /></label></div>
                      <div className="grid gap-2 sm:grid-cols-2"><div><input className="input" value={card.link_url} onChange={e => updateLandingCard(index, { link_url: e.target.value })} placeholder="Enlace (ej. /catalogo)" /><CategoryDestinationSelect categories={landingCategories} value={card.link_url} onChange={url => updateLandingCard(index, { link_url: url })} /><ProductDestinationSelect products={landingProducts} value={card.link_url} onChange={url => updateLandingCard(index, { link_url: url })} /></div><input className="input" value={card.button_text} onChange={e => updateLandingCard(index, { button_text: e.target.value })} placeholder="Texto del botón" /></div>
                    </div>
                  ))}
                  <button type="button" onClick={() => updateLandingSettings({ cards: [...(sectionForm.settings.cards || []), { title: '', description: '', image_url: '', link_url: '', button_text: '' }] })} className="w-full rounded-xl border border-dashed border-primary/40 py-3 text-sm font-semibold text-primary hover:bg-primary/5">+ Agregar tarjeta</button>
                </div>
              )}

              {(sectionForm.block_type === 'instructions' || sectionForm.block_type === 'order_instructions' || sectionForm.block_type === 'saved_lists_instructions') && (
                <div className="space-y-4 rounded-xl border border-[#d8c1a3] bg-[#fbf7f0] p-4">
                  <div>
                    <h4 className="font-semibold text-[#3b2a20]">Pasos e imágenes</h4>
                    <p className="mt-1 text-xs text-text-muted">Este bloque muestra tres tarjetas. Editá el texto y subí una imagen para cada paso; la imagen móvil es opcional.</p>
                    {sectionForm.block_type === 'order_instructions' && <p className="mt-2 text-xs text-text-muted">Guía para armar y enviar pedidos. Incluye textos iniciales sobre la presentación de los productos, el retiro sin registro y las listas para empresas aprobadas. Podés editar cada texto y su diseño de forma independiente del bloque de consulta de precios.</p>}
                    {sectionForm.block_type === 'saved_lists_instructions' && <p className="mt-2 text-xs text-text-muted">Guía para negocios con cuenta aprobada: guardar una lista, verla y editarla desde Mi cuenta, y repetirla en el carrito. Editá las tres tarjetas y subí tus propias imágenes.</p>}
                  </div>
                  {(sectionForm.settings.instruction_steps || []).map((step, index) => (
                    <div key={index} className="space-y-3 rounded-xl border border-[#e7d9c8] bg-white p-4">
                      <h5 className="font-bold text-[#71391f]">Paso {index + 1}</h5>
                      <label className="block text-sm font-medium text-text-muted">Título del paso
                        <input className="input mt-1" value={step.title} onChange={event => updateLandingInstructionStep(index, { title: event.target.value })} placeholder={`Paso ${index + 1}`} />
                      </label>
                      <label className="block text-sm font-medium text-text-muted">Instrucción
                        <textarea className="input mt-1 min-h-20" value={step.description} onChange={event => updateLandingInstructionStep(index, { description: event.target.value })} placeholder="Explicá brevemente qué debe hacer la persona" />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="block text-sm font-medium text-text-muted">Imagen del paso</p>
                          {step.image_url && <img src={step.image_url} alt={`Vista previa del paso ${index + 1}`} className="my-2 h-32 w-full rounded-lg bg-[#f6efe5] object-contain" />}
                          <input className="input mt-1" value={step.image_url} onChange={event => updateLandingInstructionStep(index, { image_url: event.target.value })} placeholder="URL de imagen" />
                          <label className={`mt-2 flex items-center justify-center rounded-xl border border-dashed px-3 py-2 text-sm font-semibold ${uploadingImage ? 'cursor-wait border-gray-300 text-gray-400' : 'cursor-pointer border-primary/40 text-primary hover:bg-primary/5'}`}>
                            {uploadingImage ? 'Subiendo…' : 'Elegir imagen desde la computadora'}
                            <input type="file" accept="image/*" className="sr-only" disabled={uploadingImage} onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void uploadLandingAsset(file, url => updateLandingInstructionStep(index, { image_url: url })) }} />
                          </label>
                        </div>
                        <div>
                          <p className="block text-sm font-medium text-text-muted">Imagen para móvil (opcional)</p>
                          {step.mobile_image_url && <img src={step.mobile_image_url} alt={`Vista previa móvil del paso ${index + 1}`} className="my-2 h-32 w-full rounded-lg bg-[#f6efe5] object-contain" />}
                          <input className="input mt-1" value={step.mobile_image_url || ''} onChange={event => updateLandingInstructionStep(index, { mobile_image_url: event.target.value })} placeholder="URL de imagen móvil" />
                          <label className={`mt-2 flex items-center justify-center rounded-xl border border-dashed px-3 py-2 text-sm font-semibold ${uploadingImage ? 'cursor-wait border-gray-300 text-gray-400' : 'cursor-pointer border-primary/40 text-primary hover:bg-primary/5'}`}>
                            {uploadingImage ? 'Subiendo…' : 'Elegir imagen móvil'}
                            <input type="file" accept="image/*" className="sr-only" disabled={uploadingImage} onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void uploadLandingAsset(file, url => updateLandingInstructionStep(index, { mobile_image_url: url })) }} />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sectionForm.block_type === 'order_instructions' && <div className="space-y-3 rounded-xl border border-[#d8c1a3] bg-white p-4">
                    <h5 className="font-semibold text-text">Aclaración sobre retiros y envíos</h5>
                    <label className="flex items-center gap-3 text-sm font-medium text-text-muted">
                      <input type="checkbox" checked={sectionForm.settings.instruction_shipping_visible !== false} onChange={event => updateLandingSettings({ instruction_shipping_visible: event.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                      Mostrar aclaración debajo de los tres pasos
                    </label>
                    <label className="block text-sm font-medium text-text-muted">Título de la aclaración
                      <input className="input mt-1" value={sectionForm.settings.instruction_shipping_title ?? ORDER_INSTRUCTIONS_CONTENT.settings.instruction_shipping_title} onChange={event => updateLandingSettings({ instruction_shipping_title: event.target.value })} />
                    </label>
                    <label className="block text-sm font-medium text-text-muted">Condiciones de retiro y envío
                      <textarea className="input mt-1 min-h-32" value={sectionForm.settings.instruction_shipping_text ?? ORDER_INSTRUCTIONS_CONTENT.settings.instruction_shipping_text} onChange={event => updateLandingSettings({ instruction_shipping_text: event.target.value })} />
                    </label>
                    <p className="text-xs text-text-muted">Podés indicar las zonas, días y condiciones del reparto. Este aviso utiliza los colores de la franja inferior y las tipografías del bloque.</p>
                  </div>}
                  <label className="block text-sm font-medium text-text-muted">Título de la franja inferior (opcional)
                    <input className="input mt-1" value={sectionForm.settings.instruction_note_title || ''} onChange={event => updateLandingSettings({ instruction_note_title: event.target.value })} placeholder="¿Sos comerciante o comprás para tu hogar?" />
                  </label>
                  <label className="block text-sm font-medium text-text-muted">Mensaje inferior (opcional)
                    <textarea className="input mt-1 min-h-16" value={sectionForm.settings.instruction_note || ''} onChange={event => updateLandingSettings({ instruction_note: event.target.value })} placeholder="Una aclaración o mensaje de confianza" />
                  </label>
                  <div className="space-y-4 rounded-xl border border-[#e7d9c8] bg-white p-4">
                    <div>
                      <h5 className="font-semibold text-text">Colores del bloque</h5>
                      <p className="mt-1 text-xs text-text-muted">Personalizá fondos, textos, números, imágenes y botón. Los cambios se guardan junto con la sección.</p>
                    </div>
                    {([
                      { title: 'Fondo y encabezado', colors: [['Fondo del bloque', 'instruction_section_bg', '#f3ecde'], ['Texto pequeño superior', 'instruction_eyebrow_color', '#706b45'], ['Título principal', 'instruction_heading_color', '#241a12'], ['Subtítulo', 'instruction_subtitle_color', '#5d573b'], ['Descripción', 'instruction_description_color', '#39332c'], ['Línea decorativa y flechas', 'instruction_accent_color', '#68663e']] },
                      { title: 'Tarjetas y pasos', colors: [['Fondo de tarjetas', 'instruction_card_bg', '#fffdf8'], ['Borde de tarjetas', 'instruction_card_border', '#e4dac7'], ['Fondo de los números', 'instruction_number_bg', '#62613b'], ['Número', 'instruction_number_color', '#fffdf8'], ['Título de cada paso', 'instruction_step_title_color', '#21170f'], ['Texto de cada paso', 'instruction_step_text_color', '#49433b'], ['Fondo de las imágenes', 'instruction_image_bg', '#f5f0e6'], ['Texto del espacio sin imagen', 'instruction_placeholder_color', '#a99a7c']] },
                      { title: 'Franja inferior y botón', colors: [['Fondo de la franja', 'instruction_note_bg', '#fffdf8'], ['Borde de la franja', 'instruction_note_border', '#e3d8c4'], ['Título de la franja', 'instruction_note_title_color', '#21170f'], ['Mensaje de la franja', 'instruction_note_text_color', '#49433b'], ['Ícono de la franja', 'instruction_note_icon_color', '#4f4e30'], ['Fondo del botón', 'instruction_button_bg', '#525333'], ['Texto del botón', 'instruction_button_color', '#ffffff']] },
                    ] as const).map(group => (
                      <div key={group.title}>
                        <h6 className="mb-2 text-sm font-medium text-text-muted">{group.title}</h6>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {group.colors.map(([label, key, fallback]) => (
                            <ColorPicker key={key} label={label} value={sectionForm.settings[key as keyof LandingSectionSettings] as string || fallback} onChange={color => updateLandingSettings({ [key]: color } as Partial<LandingSectionSettings>)} palette={palette} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-text-muted">Texto del botón
                      <input className="input mt-1" value={sectionForm.settings.button_text || ''} onChange={event => updateLandingSettings({ button_text: event.target.value })} placeholder={sectionForm.block_type === 'saved_lists_instructions' ? 'Ir a Mi cuenta' : sectionForm.block_type === 'order_instructions' ? 'Ir al catálogo y hacer mi pedido' : 'Ir al catálogo y consultar'} />
                    </label>
                    <label className="block text-sm font-medium text-text-muted">Enlace del botón
                      <input className="input mt-1" value={sectionForm.settings.button_url || ''} onChange={event => updateLandingSettings({ button_url: event.target.value })} placeholder="/catalogo" />
                      <CategoryDestinationSelect categories={landingCategories} value={sectionForm.settings.button_url || ''} onChange={url => updateLandingSettings({ button_url: url })} />
                      <ProductDestinationSelect products={landingProducts} value={sectionForm.settings.button_url || ''} onChange={url => updateLandingSettings({ button_url: url })} />
                    </label>
                  </div>
                </div>
              )}

              {sectionForm.block_type === 'business_info' && (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <h4 className="font-semibold text-text">Datos a mostrar</h4>
                  {([
                    ['show_business_hours', 'Horarios'], ['show_address', 'Dirección'], ['show_phone', 'Teléfono y WhatsApp'], ['show_email', 'Email']
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-3 text-sm font-medium text-text-muted"><input type="checkbox" checked={sectionForm.settings[key] !== false} onChange={e => updateLandingSettings({ [key]: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />{label}</label>
                  ))}
                  <p className="text-xs text-text-muted">Los valores se toman de Configuración del negocio.</p>
                </div>
              )}

              {sectionForm.block_type === 'location_map' && (
                <div className="space-y-4">
                  <CollapsibleCard icon="location" title="Dirección y datos del local" subtitle="Lo que verán tus clientes junto al mapa" defaultOpen>
                    <div className="mt-4 space-y-4">
                      <label className="block text-sm font-medium text-text-muted">Dirección o nombre para buscar en el mapa
                        <textarea className="input mt-1 min-h-20" value={sectionForm.settings.map_address || ''} onChange={e => updateLandingSettings({ map_address: e.target.value })} placeholder="Ej.: Los Primos, Ruta Interbalnearia, Las Toscas" />
                        <span className="mt-1 block text-xs">Con esta dirección se generan el mapa y las indicaciones. Si queda vacía, se conserva la ubicación habitual de Los Primos.</span>
                      </label>
                      <label className="block text-sm font-medium text-text-muted">Dirección visible (opcional)
                        <textarea className="input mt-1 min-h-16" value={sectionForm.settings.map_display_address || ''} onChange={e => updateLandingSettings({ map_display_address: e.target.value })} placeholder="Podés escribir una versión más corta, con saltos de línea" />
                        <span className="mt-1 block text-xs">Este texto cambia lo que se muestra en la tarjeta, sin mover la ubicación del mapa.</span>
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-text-muted">Texto pequeño superior
                          <input className="input mt-1" value={sectionForm.settings.map_eyebrow ?? DEFAULT_LOCATION_SETTINGS.map_eyebrow} onChange={e => updateLandingSettings({ map_eyebrow: e.target.value })} placeholder="Te esperamos en el local" />
                        </label>
                        <label className="block text-sm font-medium text-text-muted">Título de la tarjeta
                          <input className="input mt-1" value={sectionForm.settings.map_card_title ?? DEFAULT_LOCATION_SETTINGS.map_card_title} onChange={e => updateLandingSettings({ map_card_title: e.target.value })} placeholder="Pasá por Los Primos" />
                        </label>
                      </div>
                      <label className="block text-sm font-medium text-text-muted">Mensaje de la tarjeta (opcional)
                        <textarea className="input mt-1 min-h-16" value={sectionForm.settings.map_card_description || ''} onChange={e => updateLandingSettings({ map_card_description: e.target.value })} placeholder="Una bienvenida, una referencia para llegar o una aclaración" />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-border p-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-text"><input type="checkbox" checked={sectionForm.settings.map_show_hours !== false} onChange={e => updateLandingSettings({ map_show_hours: e.target.checked })} />Mostrar horarios</label>
                          <label className="mt-3 block text-xs text-text-muted">Horario para este bloque
                            <textarea disabled={sectionForm.settings.map_show_hours === false} className="input mt-1 min-h-20" value={sectionForm.settings.map_hours_text || ''} onChange={e => updateLandingSettings({ map_hours_text: e.target.value })} placeholder={settings?.business_hours || 'Usar el horario de los datos del negocio'} />
                          </label>
                          <p className="mt-1 text-xs text-text-muted">Vacío: usa el horario general del negocio.</p>
                        </div>
                        <div className="rounded-xl border border-border p-3">
                          <label className="flex items-center gap-2 text-sm font-semibold text-text"><input type="checkbox" checked={sectionForm.settings.map_show_phone !== false} onChange={e => updateLandingSettings({ map_show_phone: e.target.checked })} />Mostrar WhatsApp</label>
                          <label className="mt-3 block text-xs text-text-muted">Número para este bloque
                            <input type="tel" disabled={sectionForm.settings.map_show_phone === false} className="input mt-1" value={sectionForm.settings.map_phone_text || ''} onChange={e => updateLandingSettings({ map_phone_text: e.target.value })} placeholder={settings?.phone_number || '+598…'} />
                          </label>
                          <p className="mt-1 text-xs text-text-muted">Usá el código de país. Vacío: usa el WhatsApp general del negocio.</p>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-text-muted">Texto del botón
                          <input className="input mt-1" value={sectionForm.settings.map_link_text ?? DEFAULT_LOCATION_SETTINGS.map_link_text} onChange={e => updateLandingSettings({ map_link_text: e.target.value })} placeholder="Cómo llegar" />
                          <span className="mt-1 block text-xs">Dejalo vacío para ocultar el botón.</span>
                        </label>
                        <label className="block text-sm font-medium text-text-muted">Enlace del botón (opcional)
                          <input type="url" className="input mt-1" value={sectionForm.settings.map_link_url || ''} onChange={e => updateLandingSettings({ map_link_url: e.target.value })} placeholder="https://maps.app.goo.gl/…" aria-invalid={Boolean(sectionForm.settings.map_link_url && !safeLocationLink(sectionForm.settings.map_link_url))} />
                          <span className="mt-1 block text-xs">Vacío: genera un enlace de Google Maps desde la dirección.</span>
                        </label>
                      </div>
                    </div>
                  </CollapsibleCard>

                  <CollapsibleCard icon="compass" title="Mapa y distribución" subtitle="Posición, altura por dispositivo y forma de carga">
                    <div className="mt-4 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-text-muted">Mapa en tablet y escritorio
                          <select className="input mt-1" value={sectionForm.settings.map_side || 'right'} onChange={e => updateLandingSettings({ map_side: e.target.value as 'left' | 'right' })}><option value="right">A la derecha de los datos</option><option value="left">A la izquierda de los datos</option></select>
                        </label>
                        <label className="block text-sm font-medium text-text-muted">Mapa en celular
                          <select className="input mt-1" value={sectionForm.settings.map_mobile_order || 'last'} onChange={e => updateLandingSettings({ map_mobile_order: e.target.value as 'first' | 'last' })}><option value="last">Después de los datos</option><option value="first">Antes de los datos</option></select>
                        </label>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-3">
                        {([
                          ['map_height_mobile', 'Altura mínima en celular', 220, 520],
                          ['map_height_tablet', 'Altura mínima en tablet', 260, 640],
                          ['map_height_desktop', 'Altura mínima en escritorio', 300, 720],
                        ] as const).map(([key, label, min, max]) => <label key={key} className="block text-sm text-text-muted">{label}: {sectionForm.settings[key] ?? DEFAULT_LOCATION_SETTINGS[key]} px<input type="range" min={min} max={max} step="10" className="mt-2 w-full" value={sectionForm.settings[key] ?? DEFAULT_LOCATION_SETTINGS[key]} onChange={e => updateLandingSettings({ [key]: Number(e.target.value) })} /></label>)}
                      </div>
                      <label className="block text-sm font-medium text-text-muted">Cuándo cargar el mapa interactivo
                        <select className="input mt-1" value={sectionForm.settings.map_load_on_click ? 'click' : 'nearby'} onChange={e => updateLandingSettings({ map_load_on_click: e.target.value === 'click' })}><option value="nearby">Cuando el visitante se acerca a esta sección</option><option value="click">Al pulsar “Ver mapa interactivo”</option></select>
                        <span className="mt-1 block text-xs">Cargarlo al pulsar reduce las descargas de Google Maps y evita que el mapa interrumpa el desplazamiento en celular.</span>
                      </label>
                      <label className="block text-sm font-medium text-text-muted">Mapa de Google personalizado (opcional)
                        <textarea className="input mt-1 min-h-20 font-mono text-xs" value={sectionForm.settings.map_embed_url || ''} onChange={e => updateLandingSettings({ map_embed_url: e.target.value })} placeholder={'https://www.google.com/maps/embed?pb=… o el código <iframe …>'} aria-invalid={Boolean(sectionForm.settings.map_embed_url && !googleMapsEmbedSource(sectionForm.settings.map_embed_url))} />
                        <span className="mt-1 block text-xs">En Google Maps: Compartir → Insertar un mapa → Copiar HTML. Si lo dejás vacío, se usa la dirección escrita arriba.</span>
                        {sectionForm.settings.map_embed_url && !googleMapsEmbedSource(sectionForm.settings.map_embed_url) && <span className="mt-2 block text-xs text-red-600">Usá el código para insertar o una URL de google.com/maps/embed.</span>}
                      </label>
                    </div>
                  </CollapsibleCard>

                  <CollapsibleCard icon="palette" title="Colores y tamaños" subtitle="Fondos, títulos, textos, iconos y botón">
                    <div className="mt-4 space-y-5">
                      <div className="grid gap-4 sm:grid-cols-3">
                        {([
                          ['map_title_size_mobile', 'Título en celular', 24, 52],
                          ['map_title_size_desktop', 'Título en escritorio', 28, 72],
                          ['map_text_size', 'Texto de la tarjeta', 13, 22],
                        ] as const).map(([key, label, min, max]) => <label key={key} className="block text-sm text-text-muted">{label}: {sectionForm.settings[key] ?? DEFAULT_LOCATION_SETTINGS[key]} px<input type="range" min={min} max={max} step="1" className="mt-2 w-full" value={sectionForm.settings[key] ?? DEFAULT_LOCATION_SETTINGS[key]} onChange={e => updateLandingSettings({ [key]: Number(e.target.value) })} /></label>)}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">{LOCATION_COLOR_FIELDS.map(([label, key]) => <ColorPicker key={key} label={label} value={sectionForm.settings[key] || DEFAULT_LOCATION_SETTINGS[key]} onChange={color => updateLandingSettings({ [key]: color })} palette={palette} />)}</div>
                      <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => updateLandingSettings(Object.fromEntries(LOCATION_COLOR_FIELDS.map(([, key]) => [key, DEFAULT_LOCATION_SETTINGS[key]])))}>Restablecer los colores cálidos del bloque</button>
                    </div>
                  </CollapsibleCard>

                  <CollapsibleCard icon="image" title="Vista previa del bloque" subtitle="Refleja los textos, colores y distribución antes de guardar">
                    <div className="mt-4 overflow-hidden rounded-2xl border border-border"><LandingLocation title={sectionForm.title || 'Dónde nos encontramos'} subtitle={sectionForm.subtitle} description={sectionForm.description} settings={sectionForm.settings} business={settings} preview /></div>
                  </CollapsibleCard>
                </div>
              )}

              {sectionForm.block_type === 'image_carousel' && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-text">Fotos del carrusel</h4>
                  {(sectionForm.settings.slides || []).map((slide, index) => (
                    <div key={index} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-2">
                      <div className="space-y-2"><input className="input" value={slide.image_url} onChange={e => updateLandingSlide(index, { image_url: e.target.value })} placeholder="URL de imagen para escritorio" /><label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-primary/40 px-3 py-2 text-sm font-semibold text-primary">{uploadingImage ? 'Subiendo…' : 'Subir imagen escritorio'}<input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={e => { void uploadLandingAsset(e.target.files?.[0], url => updateLandingSlide(index, { image_url: url })); e.currentTarget.value = '' }} /></label></div>
                      <div className="space-y-2"><input className="input" value={slide.mobile_image_url || ''} onChange={e => updateLandingSlide(index, { mobile_image_url: e.target.value })} placeholder="URL móvil (opcional)" /><label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-primary/40 px-3 py-2 text-sm font-semibold text-primary">{uploadingImage ? 'Subiendo…' : 'Subir imagen móvil'}<input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={e => { void uploadLandingAsset(e.target.files?.[0], url => updateLandingSlide(index, { mobile_image_url: url })); e.currentTarget.value = '' }} /></label></div>
                      <input className="input" value={slide.link_url} onChange={e => updateLandingSlide(index, { link_url: e.target.value })} placeholder="Enlace opcional" />
                      <CategoryDestinationSelect categories={landingCategories} value={slide.link_url} onChange={url => updateLandingSlide(index, { link_url: url })} />
                      <ProductDestinationSelect products={landingProducts} value={slide.link_url} onChange={url => updateLandingSlide(index, { link_url: url })} />
                      <button type="button" onClick={() => updateLandingSettings({ slides: (sectionForm.settings.slides || []).filter((_, i) => i !== index) })} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">Quitar</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => updateLandingSettings({ slides: [...(sectionForm.settings.slides || []), { image_url: '', link_url: '' }] })} className="w-full rounded-xl border border-dashed border-primary/40 py-3 text-sm font-semibold text-primary hover:bg-primary/5">+ Agregar foto</button>
                </div>
              )}

              {sectionForm.block_type === 'product_grid' && (
                <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
                  <div><label className="mb-1 block text-sm font-semibold text-text-muted">Contenido</label><select className="input" value={sectionForm.settings.mode || 'popular'} onChange={e => updateLandingSettings({ mode: e.target.value as 'popular' | 'discounts' })}><option value="popular">Productos destacados</option><option value="discounts">Productos con descuento</option></select></div>
                  <div><label className="mb-1 block text-sm font-semibold text-text-muted">Cantidad de productos</label><input type="number" min={1} max={12} className="input" value={sectionForm.settings.limit || 5} onChange={e => updateLandingSettings({ limit: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })} /></div>
                  <div><label className="mb-1 block text-sm font-semibold text-text-muted">Texto del botón</label><input className="input" value={sectionForm.settings.button_text || ''} onChange={e => updateLandingSettings({ button_text: e.target.value })} /></div>
                  <div><label className="mb-1 block text-sm font-semibold text-text-muted">Enlace del botón</label><input className="input" value={sectionForm.settings.button_url || '/catalogo'} onChange={e => updateLandingSettings({ button_url: e.target.value })} /><CategoryDestinationSelect categories={landingCategories} value={sectionForm.settings.button_url || '/catalogo'} onChange={url => updateLandingSettings({ button_url: url })} /><ProductDestinationSelect products={landingProducts} value={sectionForm.settings.button_url || '/catalogo'} onChange={url => updateLandingSettings({ button_url: url })} /></div>
                </div>
              )}

              {['content', 'banner'].includes(sectionForm.block_type) && <div className="space-y-4">
                <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Imagen para escritorio</label>
                <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-4 text-sm font-semibold text-primary transition hover:bg-primary/10">
                  <Icon name="image" className="h-5 w-5" />
                  {uploadingImage ? 'Subiendo imagen…' : 'Elegir imagen desde el equipo'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e) => { void uploadSectionImage(e.target.files?.[0]); e.currentTarget.value = '' }} />
                </label>
                <label className="mb-2 block text-xs font-medium text-text-muted">O pegá una URL</label>
                <input
                  type="url"
                  value={sectionForm.image_url}
                  onChange={(e) => setSectionForm({ ...sectionForm, image_url: e.target.value })}
                  placeholder="https://..."
                  className="input"
                />
                {sectionForm.image_url && <img src={sectionForm.image_url} alt="Vista previa del bloque" className="mt-3 max-h-40 w-full rounded-xl border border-border object-cover" />}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-2">Imagen para móvil (opcional)</label>
                  <p className="mb-2 text-xs text-text-muted">Si queda vacía, se usará la imagen de escritorio.</p>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10">
                    <Icon name="image" className="h-5 w-5" />{uploadingImage ? 'Subiendo imagen…' : 'Elegir imagen móvil'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={e => { void uploadSectionImage(e.target.files?.[0], 'mobile'); e.currentTarget.value = '' }} />
                  </label>
                  <input type="url" value={sectionForm.settings.mobile_image_url || ''} onChange={e => updateLandingSettings({ mobile_image_url: e.target.value })} placeholder="URL de imagen móvil (opcional)" className="input mt-2" />
                  {sectionForm.settings.mobile_image_url && <img src={sectionForm.settings.mobile_image_url} alt="Vista previa móvil" className="mt-3 max-h-40 w-full rounded-xl border border-border object-cover" />}
                </div>
              </div>}

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
                <input
                  type="checkbox"
                  checked={sectionForm.is_visible}
                  onChange={(e) => setSectionForm({ ...sectionForm, is_visible: e.target.checked })}
                  className="mt-0.5 h-5 w-5 rounded border-gray-300"
                />
                <span>
                  <span className="block font-semibold text-text">Mostrar este bloque en la landing</span>
                  <span className="mt-1 block text-sm text-text-muted">Podés ocultarlo temporalmente sin borrar su contenido.</span>
                </span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowSectionModal(false)} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button onClick={saveSection} disabled={savingSection || uploadingImage} className="btn btn-primary flex-1">
                {savingSection ? 'Guardando...' : uploadingImage ? 'Subiendo imagen…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Link Modal */}
      {showMenuLinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowMenuLinkModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6">{editingMenuLink ? 'Editar Enlace' : 'Nuevo Enlace'}</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Texto *</label>
                <input
                  type="text"
                  value={menuLinkForm.label}
                  onChange={(e) => setMenuLinkForm({ ...menuLinkForm, label: e.target.value })}
                  placeholder="Ej: Ofertas"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">URL *</label>
                <input
                  type="text"
                  value={menuLinkForm.url}
                  onChange={(e) => setMenuLinkForm({ ...menuLinkForm, url: e.target.value })}
                  placeholder="/descuentos"
                  className="input"
                />
                <CategoryDestinationSelect categories={landingCategories} value={menuLinkForm.url} onChange={url => setMenuLinkForm(current => ({ ...current, url }))} />
                <ProductDestinationSelect products={landingProducts} value={menuLinkForm.url} onChange={url => setMenuLinkForm(current => ({ ...current, url }))} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-text-muted">Icono del enlace</label>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon name={menuLinkForm.icon} className="h-5 w-5" /></span>
                  <select className="input" value={menuLinkForm.icon} onChange={e => setMenuLinkForm({ ...menuLinkForm, icon: e.target.value as IconName })}>
                    {HEADER_ICON_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={menuLinkForm.is_active}
                  onChange={(e) => setMenuLinkForm({ ...menuLinkForm, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="font-semibold text-gray-700">Enlace activo</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowMenuLinkModal(false)} className="btn btn-outline flex-1">Cancelar</button>
              <button onClick={saveMenuLink} disabled={savingMenuLink} className="btn btn-primary flex-1">
                {savingMenuLink ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowAnnouncementModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6">{editingAnnouncement ? 'Editar Mensaje' : 'Nuevo Mensaje'}</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Mensaje *</label>
                <input
                  type="text"
                  value={announcementForm.message}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  placeholder="Ej: Envío gratis en compras mayores a $2000"
                  className="input"
                  maxLength={120}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Icono (emoji, opcional)</label>
                <input
                  type="text"
                  value={announcementForm.icon}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, icon: e.target.value })}
                  placeholder="🚚"
                  className="input"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Texto del botón (opcional)</label>
                <input
                  type="text"
                  value={announcementForm.link_text}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, link_text: e.target.value })}
                  placeholder="Ver más"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">URL del botón (opcional)</label>
                <input
                  type="text"
                  value={announcementForm.link_url}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, link_url: e.target.value })}
                  placeholder="/catalogo"
                  className="input"
                />
                <CategoryDestinationSelect categories={landingCategories} value={announcementForm.link_url} onChange={url => setAnnouncementForm(current => ({ ...current, link_url: url }))} />
                <ProductDestinationSelect products={landingProducts} value={announcementForm.link_url} onChange={url => setAnnouncementForm(current => ({ ...current, link_url: url }))} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementForm.is_active}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, is_active: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="font-semibold text-gray-700">Mensaje activo</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAnnouncementModal(false)} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button onClick={saveAnnouncement} disabled={savingAnnouncement} className="btn btn-primary flex-1">
                {savingAnnouncement ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
