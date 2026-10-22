'use client'

import type { CSSProperties } from 'react'
import { Icon, type IconName } from '@/components/ui/icon'
import { SiteImage } from '@/components/site-image'
import { getSiteFontFamily } from '@/lib/site-fonts'
import { FOOTER_COLOR_FIELDS, normalizeFooterSettings, safeFooterLink, type FooterSettings, type FooterBusinessInfo } from '@/lib/footer-settings'
import styles from './footer-design.module.css'

export function FooterDesign({ settings, business, preview = false }: {
  settings?: Partial<FooterSettings> | null
  business?: FooterBusinessInfo | null
  preview?: boolean
}) {
  const footer = normalizeFooterSettings(settings)
  const name = footer.brand_title || business?.site_name || 'Los Primos'
  const phone = business?.phone_number?.trim()
  const phoneDigits = phone?.replace(/\D/g, '')
  const contacts: { icon: IconName; label: string; href: string }[] = []
  if (footer.show_contact) {
    if (footer.show_phone && phone && phoneDigits) contacts.push({ icon: 'phone', label: phone, href: `https://wa.me/${phoneDigits}` })
    if (footer.show_email && business?.email) contacts.push({ icon: 'mail', label: business.email, href: `mailto:${business.email.trim()}` })
    if (footer.show_address && business?.address) contacts.push({ icon: 'location', label: business.address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}` })
  }
  const links = footer.show_navigation ? footer.links.map(link => ({ ...link, href: safeFooterLink(link.url) })).filter(link => link.label.trim() && link.href) : []
  const showHours = footer.show_hours && business?.business_hours?.trim()
  const ctaHref = safeFooterLink(footer.cta_url)
  const logoUrl = safeFooterLink(footer.logo_url)
  const extraColumns = Number(contacts.length > 0) + Number(links.length > 0) + Number(Boolean(showHours))
  const style = {
    ...Object.fromEntries(FOOTER_COLOR_FIELDS.map(([key]) => [`--footer-${key}`, footer[key]])),
    '--footer-heading-font': getSiteFontFamily(footer.heading_font),
    '--footer-heading-weight': footer.heading_weight,
    '--footer-body-size': `${footer.body_size}px`,
    '--footer-brand-size': `${footer.brand_size}px`,
    '--footer-brand-mobile': `${footer.brand_size_mobile}px`,
    '--footer-heading-size': `${footer.heading_size}px`,
    '--footer-logo-width': `${footer.logo_width}px`,
    '--footer-logo-mobile': `${footer.logo_width_mobile}px`,
    '--footer-padding': `${footer.padding_y}px`,
    '--footer-grid': extraColumns ? `minmax(0, 1.35fr) repeat(${extraColumns}, minmax(0, 1fr))` : 'minmax(0, 1fr)',
    fontFamily: getSiteFontFamily(footer.body_font),
    fontWeight: footer.body_weight,
    pointerEvents: preview ? 'none' : undefined
  } as CSSProperties
  const linkProps = preview ? { tabIndex: -1 } : {}

  return <footer className={styles.footer} style={style} aria-label={preview ? 'Vista previa del pie de página' : 'Pie de página'}>
    <div className={styles.inner}>
      {footer.show_cta && <div className={styles.cta}>
        <div>
          {footer.cta_title && <h2 className={styles.ctaTitle}>{footer.cta_title}</h2>}
          {footer.cta_description && <p className="whitespace-pre-line">{footer.cta_description}</p>}
        </div>
        {footer.cta_label && ctaHref && <a {...linkProps} href={ctaHref} className={styles.button}>{footer.cta_label}<span aria-hidden="true">→</span></a>}
      </div>}
      <div className={styles.grid}>
        <div className={styles.brand}>
          {footer.eyebrow && <p className={styles.eyebrow}>{footer.eyebrow}</p>}
          {logoUrl ? <SiteImage src={logoUrl} alt={name} width={360} height={160} sizes={`${Math.max(footer.logo_width, footer.logo_width_mobile)}px`} className={styles.logo} /> : <h2 className={styles.brandTitle}>{name}</h2>}
          {footer.description && <p className={styles.brandDescription}>{footer.description}</p>}
          <span className={styles.rule} aria-hidden="true" />
        </div>
        {links.length > 0 && <nav aria-label="Enlaces del pie de página">
          <h2 className={styles.heading}>{footer.navigation_title}</h2>
          <ul className={styles.list}>{links.map((link, index) => <li key={index}><a {...linkProps} href={link.href} className={`${styles.link} ${styles.navLink}`}><span className={styles.navArrow} aria-hidden="true">↗</span>{link.label}</a></li>)}</ul>
        </nav>}
        {contacts.length > 0 && <div>
          <h2 className={styles.heading}>{footer.contact_title}</h2>
          <ul className={styles.list}>{contacts.map(contact => <li key={contact.icon}>
            <a {...linkProps} href={contact.href} target={contact.icon === 'mail' ? undefined : '_blank'} rel="noopener noreferrer" className={`${styles.link} ${styles.contact}`}>
              <span className={styles.icon}><Icon name={contact.icon} className="h-4 w-4" /></span>
              <span>{contact.icon === 'phone' && <span className="block text-xs" style={{ color: footer.text_color }}>WhatsApp</span>}{contact.label}</span>
            </a>
          </li>)}</ul>
        </div>}
        {showHours && <div>
          <h2 className={styles.heading}>{footer.hours_title}</h2>
          <div className={styles.contact}><span className={styles.icon}><Icon name="clock" className="h-4 w-4" /></span><p className={styles.hours}>{business?.business_hours}</p></div>
        </div>}
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} {name}{footer.copyright_text ? `. ${footer.copyright_text}` : ''}</p>
        {!preview && <a className={`${styles.link} ${styles.topLink}`} href="#" onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }}>Volver arriba <span aria-hidden="true">↑</span></a>}
      </div>
    </div>
  </footer>
}
