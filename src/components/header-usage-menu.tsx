'use client'

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { resolveMobileMenuSettings, type MobileMenuSettings } from '@/lib/mobile-menu-settings'
import { resolveUsageMenuSettings, usageMenuLinks, type CatalogUsageLink } from '@/lib/catalog-usage-navigation'
import { getSiteFontFamily } from '@/lib/site-fonts'
import styles from './header-usage-menu.module.css'

export function HeaderUsageMenu({ links, settings, mobile = false, uppercase = false, showIcon = true, overHero = false, preview = false, triggerStyle, onNavigate, onOpen }: {
  links: CatalogUsageLink[]
  settings?: Partial<MobileMenuSettings> | null
  mobile?: boolean
  uppercase?: boolean
  showIcon?: boolean
  overHero?: boolean
  preview?: boolean
  triggerStyle?: CSSProperties
  onNavigate?: () => void
  onOpen?: () => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const colors = resolveMobileMenuSettings(settings)
  const options = resolveUsageMenuSettings(colors.usage_menu)
  const visibleLinks = usageMenuLinks(links, options)

  useEffect(() => {
    if (!open) return
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    function keyboard(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
      if (trigger.current?.getClientRects().length) trigger.current.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', keyboard)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', keyboard) }
  }, [open])

  if (!visibleLinks.length) return null
  const fontFamily = options.font_family === 'inherit' ? triggerStyle?.fontFamily : getSiteFontFamily(options.font_family)
  const fontWeight = options.font_weight === 'inherit' ? triggerStyle?.fontWeight : options.font_weight
  const customTriggerColor = mobile ? options.mobile_text_color : overHero ? options.transparent_text_color : options.desktop_text_color
  const textUppercase = options.uppercase === 'inherit' ? uppercase : options.uppercase === 'uppercase'
  const hasIcon = options.show_trigger_icon === 'inherit' ? showIcon : options.show_trigger_icon === 'show'
  const style = {
    fontFamily,
    fontWeight,
    '--usage-bg': options.panel_background || colors.background,
    '--usage-text': options.panel_text_color || colors.text,
    '--usage-mobile-text': options.mobile_text_color || colors.text,
    '--usage-title-text': options.panel_title_color || options.panel_text_color || colors.text,
    '--usage-hover-bg': options.hover_background || colors.hover_background,
    '--usage-hover-text': options.hover_text_color || colors.hover_text,
    '--usage-border': options.border_color || colors.border,
  } as CSSProperties

  return <div ref={root} className={`${styles.root} ${mobile ? styles.mobile : ''}`} style={style} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false) }}>
    <button ref={trigger} type="button" className={styles.trigger} style={{ ...triggerStyle, fontFamily, fontWeight, color: mobile ? undefined : customTriggerColor || triggerStyle?.color, textTransform: textUppercase ? 'uppercase' : 'none' }} aria-expanded={open} aria-controls={`${id}-links`} onClick={() => { if (!open) onOpen?.(); setOpen(value => !value) }}>
      {hasIcon && <Icon name={options.trigger_icon} className="h-5 w-5 shrink-0" />}
      <span className={styles.label}>{options.label}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${styles.arrow} ${open ? styles.openArrow : ''}`}><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    {open && <div id={`${id}-links`} className={styles.dropdown} style={{ fontFamily: options.link_font_family === 'inherit' ? undefined : getSiteFontFamily(options.link_font_family), fontWeight: options.link_font_weight === 'inherit' ? undefined : options.link_font_weight }}>
      {options.panel_title && <p className={styles.heading}>{options.panel_title}</p>}
      <ul className={styles.list}>{visibleLinks.map(link => <li key={link.id}>{preview ? <span className={styles.link}>{options.show_link_icons && <Icon name={link.icon} className="mt-0.5 h-4 w-4 shrink-0" />}<span>{link.label}</span></span> : <Link href={link.url} className={styles.link} onClick={() => { setOpen(false); onNavigate?.() }}>{options.show_link_icons && <Icon name={link.icon} className="mt-0.5 h-4 w-4 shrink-0" />}<span>{link.label}</span></Link>}</li>)}</ul>
    </div>}
  </div>
}
