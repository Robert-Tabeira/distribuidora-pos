'use client'

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { resolveMobileMenuSettings, type MobileMenuSettings } from '@/lib/mobile-menu-settings'
import type { CatalogUsageLink } from '@/lib/catalog-usage-navigation'
import styles from './header-usage-menu.module.css'

export function HeaderUsageMenu({ links, settings, mobile = false, uppercase = false, showIcon = true, triggerStyle, onNavigate, onOpen }: {
  links: CatalogUsageLink[]
  settings?: Partial<MobileMenuSettings> | null
  mobile?: boolean
  uppercase?: boolean
  showIcon?: boolean
  triggerStyle?: CSSProperties
  onNavigate?: () => void
  onOpen?: () => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const colors = resolveMobileMenuSettings(settings)

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

  if (!links.length) return null
  const style = {
    fontFamily: triggerStyle?.fontFamily,
    fontWeight: triggerStyle?.fontWeight,
    '--usage-bg': colors.background,
    '--usage-text': colors.text,
    '--usage-hover-bg': colors.hover_background,
    '--usage-hover-text': colors.hover_text,
    '--usage-border': colors.border,
  } as CSSProperties

  return <div ref={root} className={`${styles.root} ${mobile ? styles.mobile : ''}`} style={style} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false) }}>
    <button ref={trigger} type="button" className={styles.trigger} style={{ ...triggerStyle, textTransform: uppercase ? 'uppercase' : undefined }} aria-expanded={open} aria-controls={`${id}-links`} onClick={() => { if (!open) onOpen?.(); setOpen(value => !value) }}>
      {showIcon && <Icon name="document" className="h-5 w-5 shrink-0" />}
      <span className={styles.label}>Modo de uso</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`${styles.arrow} ${open ? styles.openArrow : ''}`}><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    {open && <div id={`${id}-links`} className={styles.dropdown}>
      <p className={styles.heading}>Cómo utilizar el catálogo</p>
      <ul className={styles.list}>{links.map(link => <li key={link.id}><Link href={link.url} className={styles.link} onClick={() => { setOpen(false); onNavigate?.() }}><Icon name={link.icon} className="mt-0.5 h-4 w-4 shrink-0" /><span>{link.label}</span></Link></li>)}</ul>
    </div>}
  </div>
}
