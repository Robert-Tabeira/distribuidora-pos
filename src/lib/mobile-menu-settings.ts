import { resolveUsageMenuSettings, type CatalogUsageSettings } from '@/lib/catalog-usage-navigation'

export interface MobileMenuSettings {
  usage_menu?: Partial<CatalogUsageSettings>
  background: string
  text: string
  active_text: string
  active_background: string
  hover_text: string
  hover_background: string
  border: string
}

export const DEFAULT_MOBILE_MENU_SETTINGS: MobileMenuSettings = {
  background: '#fffdf8',
  text: '#332a20',
  active_text: '#575b36',
  active_background: '#eeeedf',
  hover_text: '#414529',
  hover_background: '#f2ecdf',
  border: '#e3d7c4'
}

export const MOBILE_MENU_COLOR_FIELDS = [
  ['background', 'Fondo del menú desplegable'],
  ['text', 'Enlaces e iconos'],
  ['active_text', 'Enlace activo e icono'],
  ['active_background', 'Fondo del enlace activo'],
  ['hover_text', 'Enlace al pasar el cursor / enfocar'],
  ['hover_background', 'Fondo al pasar el cursor / enfocar'],
  ['border', 'Borde del menú y separador']
] as const

export function resolveMobileMenuSettings(settings?: Partial<MobileMenuSettings> | null): MobileMenuSettings {
  const resolved = { ...DEFAULT_MOBILE_MENU_SETTINGS }
  for (const [key] of MOBILE_MENU_COLOR_FIELDS) {
    const color = settings?.[key]
    if (typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)) resolved[key] = color
  }
  resolved.usage_menu = resolveUsageMenuSettings(settings?.usage_menu)
  return resolved
}
