'use client'

import { useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Icon, type IconName } from '@/components/ui/icon'
import { getSiteFontFamily } from '@/lib/site-fonts'
import { landingBackgroundColor, landingCardBackgroundColor, type LandingBackgroundSettings } from '@/lib/landing-background'
import type { InstructionGroupSettings } from '@/lib/landing-instruction-group'

interface GroupAppearance extends InstructionGroupSettings, LandingBackgroundSettings {
  heading_font?: string
  body_font?: string
  heading_weight?: string
  body_weight?: string
  mobile_text_alignment?: string
  desktop_text_alignment?: string
}

export function LandingInstructionAccordion({ title, subtitle, description, settings, items }: {
  title: string
  subtitle?: string | null
  description?: string | null
  settings: GroupAppearance
  items: Array<{ id: string; title: string; icon: IconName; content: ReactNode }>
}) {
  const id = useId()
  const [activeId, setActiveId] = useState<string | null>(null)
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  if (!items.length) return null
  const headingColor = settings.instruction_group_heading_color || '#30261d'
  const iconColor = settings.instruction_group_icon_color || '#62643e'
  const headingFont = settings.heading_font && settings.heading_font !== 'inherit' ? settings.heading_font : 'lora'
  const bodyFont = settings.body_font && settings.body_font !== 'inherit' ? settings.body_font : 'dm_sans'
  const style = {
    '--landing-heading-font': getSiteFontFamily(headingFont),
    '--landing-body-font': getSiteFontFamily(bodyFont),
    '--landing-heading-weight': settings.heading_weight || '700',
    '--landing-body-weight': settings.body_weight || '400',
    '--group-mobile-align': ['left', 'center', 'right'].includes(settings.mobile_text_alignment || '') ? settings.mobile_text_alignment : 'left',
    '--group-desktop-align': ['left', 'center', 'right'].includes(settings.desktop_text_alignment || '') ? settings.desktop_text_alignment : 'left',
    backgroundColor: landingBackgroundColor('instruction_group', settings),
    color: settings.instruction_group_text_color || '#706556',
  } as CSSProperties

  return <section className="landing-section px-4 py-12 sm:px-6 sm:py-16" data-heading-font={headingFont} data-body-font={bodyFont} style={style} aria-labelledby={`${id}-heading`}>
    <div className="mx-auto max-w-7xl">
      <div className="group-heading mb-7 sm:mb-9">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: iconColor }}>Tu catálogo, paso a paso</p>
        <h2 id={`${id}-heading`} className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl" style={{ color: headingColor }}>{title}</h2>
        {subtitle && <p className="mt-3 whitespace-pre-line text-lg font-semibold" style={{ color: headingColor }}>{subtitle}</p>}
        {description && <p className="mt-3 whitespace-pre-line text-sm leading-6 sm:text-base">{description}</p>}
      </div>
      <div className="space-y-3">
        {items.map((item, index) => {
          const expanded = activeId === item.id
          return <div key={item.id} className="overflow-hidden rounded-2xl border shadow-[0_4px_18px_rgba(72,54,31,0.04)] sm:rounded-3xl" style={{ backgroundColor: landingCardBackgroundColor('instruction_group', settings), borderColor: settings.instruction_group_border_color || '#e3d7c4' }}>
            <h3><button ref={element => { buttons.current[index] = element }} type="button" id={`${id}-trigger-${index}`} aria-expanded={expanded} aria-controls={`${id}-panel-${index}`} className="flex min-h-20 w-full items-center gap-3 px-4 py-4 text-left transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] sm:gap-4 sm:px-6 sm:py-5" style={{ color: headingColor, outlineColor: iconColor }} onClick={() => setActiveId(expanded ? null : item.id)} onKeyDown={event => {
              let next: number | undefined
              if (event.key === 'ArrowDown') next = (index + 1) % items.length
              if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length
              if (event.key === 'Home') next = 0
              if (event.key === 'End') next = items.length - 1
              if (next !== undefined) { event.preventDefault(); buttons.current[next]?.focus() }
            }}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ color: iconColor, backgroundColor: settings.instruction_group_icon_bg || '#eeeadc' }}><Icon name={item.icon} className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1 break-words text-base sm:text-xl" style={{ fontWeight: settings.heading_weight || '700' }}>{item.title}</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`h-5 w-5 shrink-0 motion-safe:transition-transform ${expanded ? 'rotate-180' : ''}`} style={{ color: iconColor }}><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button></h3>
            <div id={`${id}-panel-${index}`} role="region" aria-labelledby={`${id}-trigger-${index}`} hidden={!expanded}>
              {expanded && <div className="border-t" style={{ borderColor: settings.instruction_group_border_color || '#e3d7c4' }}>{item.content}</div>}
            </div>
          </div>
        })}
      </div>
    </div>
    <style jsx>{`
      .group-heading { text-align: var(--group-mobile-align); }
      @media (min-width: 1024px) { .group-heading { text-align: var(--group-desktop-align); } }
    `}</style>
  </section>
}
