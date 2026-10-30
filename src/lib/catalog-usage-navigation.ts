import type { IconName } from '@/components/ui/icon'

export interface CatalogUsageLink {
  id: string
  label: string
  url: string
  icon: IconName
}

export const USAGE_MENU_ICONS: { value: IconName; label: string }[] = [
  { value: 'document', label: 'Documento' }, { value: 'info', label: 'Información' },
  { value: 'chat', label: 'Mensaje' }, { value: 'cart', label: 'Carrito' },
  { value: 'store', label: 'Local' }, { value: 'grid', label: 'Catálogo' },
  { value: 'box', label: 'Caja' }, { value: 'users', label: 'Personas' },
  { value: 'check', label: 'Confirmación' }, { value: 'link', label: 'Enlace' },
  { value: 'scroll', label: 'Lista' }, { value: 'sparkles', label: 'Destellos' },
]

export interface CatalogUsageSettings {
  enabled: boolean
  label: string
  panel_title: string
  trigger_icon: IconName
  show_trigger_icon: 'inherit' | 'show' | 'hide'
  show_link_icons: boolean
  uppercase: 'inherit' | 'uppercase' | 'normal'
  font_family: string
  font_weight: string
  link_font_family: string
  link_font_weight: string
  desktop_text_color: string
  transparent_text_color: string
  mobile_text_color: string
  panel_background: string
  panel_text_color: string
  panel_title_color: string
  hover_background: string
  hover_text_color: string
  border_color: string
  section_ids: string[] | null
  link_labels: Record<string, string>
  link_icons: Record<string, IconName>
}

export const DEFAULT_USAGE_MENU_SETTINGS: CatalogUsageSettings = {
  enabled: true, label: 'Modo de uso', panel_title: 'Cómo utilizar el catálogo',
  trigger_icon: 'document', show_trigger_icon: 'inherit', show_link_icons: true, uppercase: 'inherit',
  font_family: 'inherit', font_weight: 'inherit', link_font_family: 'inherit', link_font_weight: 'inherit',
  desktop_text_color: '', transparent_text_color: '', mobile_text_color: '', panel_background: '',
  panel_text_color: '', panel_title_color: '', hover_background: '', hover_text_color: '', border_color: '',
  section_ids: null, link_labels: {}, link_icons: {},
}

export const USAGE_MENU_COLOR_FIELDS = [
  ['desktop_text_color', 'Botón en header sólido / catálogo'],
  ['transparent_text_color', 'Botón sobre el hero'],
  ['mobile_text_color', 'Botón en el menú móvil'],
  ['panel_background', 'Fondo del desplegable'],
  ['panel_title_color', 'Título del desplegable'],
  ['panel_text_color', 'Enlaces e iconos del desplegable'],
  ['hover_background', 'Fondo al pasar el cursor'],
  ['hover_text_color', 'Texto al pasar el cursor'],
  ['border_color', 'Bordes'],
] as const

export function resolveUsageMenuSettings(settings?: Partial<CatalogUsageSettings> | null): CatalogUsageSettings {
  const source = settings || {}
  const result = { ...DEFAULT_USAGE_MENU_SETTINGS, link_labels: {}, link_icons: {} } as CatalogUsageSettings
  if (typeof source.enabled === 'boolean') result.enabled = source.enabled
  if (typeof source.show_link_icons === 'boolean') result.show_link_icons = source.show_link_icons
  if (typeof source.label === 'string' && source.label.trim()) result.label = source.label.trim().slice(0, 80)
  if (typeof source.panel_title === 'string') result.panel_title = source.panel_title.trim().slice(0, 120)
  if (USAGE_MENU_ICONS.some(icon => icon.value === source.trigger_icon)) result.trigger_icon = source.trigger_icon!
  if (source.show_trigger_icon === 'show' || source.show_trigger_icon === 'hide') result.show_trigger_icon = source.show_trigger_icon
  if (source.uppercase === 'uppercase' || source.uppercase === 'normal') result.uppercase = source.uppercase
  for (const key of ['font_family', 'link_font_family'] as const) {
    const font = source[key]
    if (typeof font === 'string' && /^(inherit|dm_sans|fira_sans|lora|georgia|custom:[a-zA-Z0-9_-]+)$/.test(font)) result[key] = font
  }
  for (const key of ['font_weight', 'link_font_weight'] as const) {
    const weight = source[key]
    if (typeof weight === 'string' && /^(inherit|[1-9]00)$/.test(weight)) result[key] = weight
  }
  for (const [key] of USAGE_MENU_COLOR_FIELDS) {
    const color = source[key]
    if (typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)) result[key] = color
  }
  if (Array.isArray(source.section_ids)) result.section_ids = [...new Set(source.section_ids.filter(id => typeof id === 'string'))]
  if (source.link_labels && typeof source.link_labels === 'object') {
    result.link_labels = Object.fromEntries(Object.entries(source.link_labels).filter(([, value]) => typeof value === 'string').map(([key, value]) => [key, value.slice(0, 120)]))
  }
  if (source.link_icons && typeof source.link_icons === 'object') {
    result.link_icons = Object.fromEntries(Object.entries(source.link_icons).filter(([, value]) => USAGE_MENU_ICONS.some(icon => icon.value === value)))
  }
  return result
}

export function usageMenuLinks(links: CatalogUsageLink[], settings: CatalogUsageSettings): CatalogUsageLink[] {
  if (!settings.enabled) return []
  const ordered = settings.section_ids === null ? links : settings.section_ids.flatMap(id => links.filter(link => link.id === id))
  return ordered.map(link => ({ ...link, label: settings.link_labels[link.id]?.trim() || link.label, icon: settings.link_icons[link.id] || link.icon }))
}

export const INSTRUCTION_ANCHOR_PREFIX = 'instructivo-'
export const instructionAnchor = (id: string) => `${INSTRUCTION_ANCHOR_PREFIX}${id}`

export function catalogUsageLink(section: { id: string; title: string | null; section_name: string; block_type: string }): CatalogUsageLink {
  return {
    id: section.id,
    label: section.title?.trim() || section.section_name,
    url: `/#${encodeURIComponent(instructionAnchor(section.id))}`,
    icon: section.block_type === 'instructions' ? 'chat' : section.block_type === 'pickup_instructions' ? 'store' : section.block_type === 'saved_lists_instructions' ? 'document' : 'cart',
  }
}
