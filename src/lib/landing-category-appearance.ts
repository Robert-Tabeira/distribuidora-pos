export interface LandingCategoryAppearance {
  category_eyebrow?: string
  category_title_size_mobile?: number
  category_title_size_desktop?: number
  category_section_bg?: string
  category_heading_color?: string
  category_subtitle_color?: string
  category_description_color?: string
  category_accent_color?: string
  category_card_bg?: string
  category_card_border?: string
  category_label_color?: string
  category_card_hover_bg?: string
  category_card_hover_border?: string
  category_label_hover_color?: string
}

export const CATEGORY_APPEARANCE_DEFAULTS = {
  category_eyebrow: 'Nuestro catálogo',
  category_title_size_mobile: 30,
  category_title_size_desktop: 42,
  category_section_bg: '#f8f3e9',
  category_heading_color: '#30261d',
  category_subtitle_color: '#656044',
  category_description_color: '#61594f',
  category_accent_color: '#77764e',
  category_card_bg: '#fffdf8',
  category_card_border: '#e3d7c4',
  category_label_color: '#332a20',
  category_card_hover_bg: '#f1eddf',
  category_card_hover_border: '#a8a07c',
  category_label_hover_color: '#4f5233'
}

export const CATEGORY_APPEARANCE_COLORS = [
  ['category_section_bg', 'Fondo del bloque'],
  ['category_heading_color', 'Título de la sección'],
  ['category_subtitle_color', 'Subtítulo'],
  ['category_description_color', 'Descripción'],
  ['category_accent_color', 'Etiqueta y línea decorativa'],
  ['category_card_bg', 'Fondo de las tarjetas'],
  ['category_card_border', 'Borde de las tarjetas'],
  ['category_label_color', 'Nombre de la categoría'],
  ['category_card_hover_bg', 'Tarjetas al pasar el cursor'],
  ['category_card_hover_border', 'Borde al pasar el cursor'],
  ['category_label_hover_color', 'Nombre al pasar el cursor']
] as const

export function categoryTitleSize(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(80, Math.max(22, value)) : fallback
}
