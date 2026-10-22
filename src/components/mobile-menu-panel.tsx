import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { Icon, type IconName } from '@/components/ui/icon'
import { MOBILE_MENU_COLOR_FIELDS, resolveMobileMenuSettings, type MobileMenuSettings } from '@/lib/mobile-menu-settings'
import styles from './mobile-menu-panel.module.css'

export interface MobileMenuItem {
  id: string
  label: string
  url: string
  active: boolean
  icon: IconName
}

export function MobileMenuPanel({ settings, links, fontFamily, fontWeight, letterSpacing, uppercase, onNavigate, children, preview = false, className = '', id }: {
  settings?: Partial<MobileMenuSettings> | null
  links: MobileMenuItem[]
  fontFamily: string
  fontWeight: string
  letterSpacing: string
  uppercase: boolean
  onNavigate?: () => void
  children?: ReactNode
  preview?: boolean
  className?: string
  id?: string
}) {
  const colors = resolveMobileMenuSettings(settings)
  const style = {
    ...Object.fromEntries(MOBILE_MENU_COLOR_FIELDS.map(([key]) => [`--mobile-menu-${key.replace(/_/g, '-')}`, colors[key]])),
  } as CSSProperties
  const navStyle = { fontFamily, fontWeight, letterSpacing, textTransform: uppercase ? 'uppercase' : undefined } as CSSProperties

  return <div id={id} className={`${styles.panel} ${className}`} style={style}>
    {links.length > 0 && <nav aria-label={preview ? 'Vista previa de enlaces móviles' : 'Menú principal móvil'} className={styles.nav} style={navStyle}>
      {links.map(link => preview
        ? <span key={link.id} className={styles.link} data-active={link.active}><Icon name={link.icon} className="h-5 w-5 shrink-0" />{link.label}</span>
        : <Link key={link.id} href={link.url} onClick={onNavigate} aria-current={link.active ? 'page' : undefined} className={styles.link}><Icon name={link.icon} className="h-5 w-5 shrink-0" />{link.label}</Link>)}
    </nav>}
    {children && <div className={styles.info}>{children}</div>}
  </div>
}
