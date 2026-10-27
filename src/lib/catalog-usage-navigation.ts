import type { IconName } from '@/components/ui/icon'

export interface CatalogUsageLink {
  id: string
  label: string
  url: string
  icon: IconName
}

export const INSTRUCTION_ANCHOR_PREFIX = 'instructivo-'
export const instructionAnchor = (id: string) => `${INSTRUCTION_ANCHOR_PREFIX}${id}`

export function catalogUsageLink(section: { id: string; title: string | null; section_name: string; block_type: string }): CatalogUsageLink {
  return {
    id: section.id,
    label: section.title?.trim() || section.section_name,
    url: `/landing#${encodeURIComponent(instructionAnchor(section.id))}`,
    icon: section.block_type === 'instructions' ? 'chat' : section.block_type === 'pickup_instructions' ? 'store' : section.block_type === 'saved_lists_instructions' ? 'document' : 'cart',
  }
}
