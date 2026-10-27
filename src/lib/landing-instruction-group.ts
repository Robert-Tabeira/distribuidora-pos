import { isInstructionBlock } from '@/lib/landing-background'

export interface InstructionGroupSettings {
  instruction_section_ids?: string[]
  instruction_row_titles?: Record<string, string>
  instruction_group_heading_color?: string
  instruction_group_text_color?: string
  instruction_group_border_color?: string
  instruction_group_icon_color?: string
  instruction_group_icon_bg?: string
}

export const INSTRUCTION_GROUP_CONTENT = {
  section_name: 'Guía de uso del catálogo',
  title: 'Cómo utilizar el catálogo web',
  description: 'Elegí lo que necesitás hacer y te mostramos cómo, paso a paso.',
}

export const INSTRUCTION_GROUP_COLORS = [
  ['Títulos de la guía y los desplegables', 'instruction_group_heading_color', '#30261d'],
  ['Descripción', 'instruction_group_text_color', '#706556'],
  ['Bordes', 'instruction_group_border_color', '#e3d7c4'],
  ['Iconos y flechas', 'instruction_group_icon_color', '#62643e'],
  ['Fondo de los iconos', 'instruction_group_icon_bg', '#eeeadc'],
] as const

interface InstructionSection {
  id: string
  block_type: string
  is_visible: boolean
  settings: InstructionGroupSettings | null
}

export function instructionGroupMembers<T extends InstructionSection>(settings: InstructionGroupSettings, sections: T[]): T[] {
  const available = sections.filter(section => section.is_visible && isInstructionBlock(section.block_type))
  if (!Array.isArray(settings.instruction_section_ids)) return available
  const byId = new Map(available.map(section => [section.id, section]))
  return [...new Set(settings.instruction_section_ids)].flatMap(id => {
    const section = byId.get(id)
    return section ? [section] : []
  })
}

/** References the existing blocks so their texts, images and editing stay intact. */
export function instructionLandingLayout<T extends InstructionSection>(sections: T[]): Array<{ section: T | null; instructions?: T[] }> {
  const visible = sections.filter(section => section.is_visible)
  const groups = visible.filter(section => section.block_type === 'instruction_group')
  const claimed = new Set<string>()
  const members = new Map(groups.map(group => {
    const items = instructionGroupMembers(group.settings || {}, visible).filter(item => !claimed.has(item.id))
    items.forEach(item => claimed.add(item.id))
    return [group.id, items] as const
  }))
  if (sections.some(section => section.block_type === 'instruction_group')) {
    return visible.flatMap(section => claimed.has(section.id) ? [] : [{ section, instructions: members.get(section.id) }])
  }
  const instructions = visible.filter(section => isInstructionBlock(section.block_type))
  if (instructions.length < 2) return visible.map(section => ({ section }))
  let inserted = false
  return visible.flatMap((section): Array<{ section: T | null; instructions?: T[] }> => {
    if (!isInstructionBlock(section.block_type)) return [{ section }]
    if (inserted) return []
    inserted = true
    return [{ section: null, instructions }]
  })
}
