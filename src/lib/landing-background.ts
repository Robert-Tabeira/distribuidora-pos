export interface LandingBackgroundSettings {
  background_color?: string
  card_background_color?: string
  instruction_section_bg?: string
  instruction_card_bg?: string
  instruction_texture_enabled?: boolean
  category_section_bg?: string
  category_card_bg?: string
  map_section_bg?: string
  map_card_bg?: string
}

export const INSTRUCTION_BACKGROUND_TEXTURE = 'radial-gradient(ellipse at 96% 4%, rgba(160, 125, 76, 0.13), transparent 32%), radial-gradient(ellipse at 2% 96%, rgba(160, 125, 76, 0.10), transparent 30%), repeating-linear-gradient(135deg, rgba(74, 59, 35, 0.018) 0px, rgba(74, 59, 35, 0.018) 1px, transparent 2px, transparent 9px)'

export const INSTRUCTION_BLOCK_TYPES = ['instructions', 'order_instructions', 'pickup_instructions', 'saved_lists_instructions']

export function isInstructionBlock(type: string): boolean {
  return INSTRUCTION_BLOCK_TYPES.includes(type)
}

export function landingBackgroundKey(type: string): 'background_color' | 'instruction_section_bg' | 'category_section_bg' | 'map_section_bg' {
  if (isInstructionBlock(type)) return 'instruction_section_bg'
  if (type === 'categories') return 'category_section_bg'
  if (type === 'location_map') return 'map_section_bg'
  return 'background_color'
}

export function landingBackgroundColor(type: string, settings: LandingBackgroundSettings): string {
  const fallback = isInstructionBlock(type) ? '#f3ecde' : ['categories', 'weekly_hours'].includes(type) ? '#f8f3e9' : type === 'location_map' ? '#f6f0e5' : type === 'banner' ? '#fff7ed' : type === 'business_info' ? '#f6efe5' : type === 'product_grid' ? '#fbf7f0' : '#fffdf9'
  return settings[landingBackgroundKey(type)] || settings.background_color || fallback
}

export function landingCardBackgroundKey(type: string): 'card_background_color' | 'instruction_card_bg' | 'category_card_bg' | 'map_card_bg' {
  if (isInstructionBlock(type)) return 'instruction_card_bg'
  if (type === 'categories') return 'category_card_bg'
  if (type === 'location_map') return 'map_card_bg'
  return 'card_background_color'
}

export function landingCardBackgroundColor(type: string, settings: LandingBackgroundSettings): string {
  return settings[landingCardBackgroundKey(type)] || (isInstructionBlock(type) || ['categories', 'location_map', 'weekly_hours'].includes(type) ? '#fffdf8' : '#ffffff')
}

export function hasLandingCards(type: string): boolean {
  return isInstructionBlock(type) || ['categories', 'location_map', 'weekly_hours', 'banner', 'feature_cards', 'business_info', 'product_grid'].includes(type)
}
