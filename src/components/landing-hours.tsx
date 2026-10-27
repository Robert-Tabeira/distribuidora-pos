import type { CSSProperties } from 'react'
import { Icon } from '@/components/ui/icon'
import { getSiteFontFamily } from '@/lib/site-fonts'
import { landingBackgroundColor, landingCardBackgroundColor, type LandingBackgroundSettings } from '@/lib/landing-background'
import { normalizeWeeklyHours, validHoursPeriod, WEEK_DAYS, type LandingHoursSettings } from '@/lib/landing-hours'
import styles from './landing-hours.module.css'

interface HoursAppearance extends LandingHoursSettings, LandingBackgroundSettings {
  heading_font?: string
  body_font?: string
  heading_weight?: string
  body_weight?: string
  mobile_text_alignment?: string
  desktop_text_alignment?: string
}

export function LandingHours({ title, subtitle, description, settings }: {
  title: string
  subtitle?: string | null
  description?: string | null
  settings: HoursAppearance
}) {
  const headingFont = settings.heading_font && settings.heading_font !== 'inherit' ? settings.heading_font : 'lora'
  const bodyFont = settings.body_font && settings.body_font !== 'inherit' ? settings.body_font : 'dm_sans'
  const style = {
    '--landing-heading-font': getSiteFontFamily(headingFont), '--landing-body-font': getSiteFontFamily(bodyFont),
    '--landing-heading-weight': settings.heading_weight || '700', '--landing-body-weight': settings.body_weight || '400',
    '--hours-heading': settings.hours_heading_color || '#30261d', '--hours-text': settings.hours_text_color || '#61594c',
    '--hours-day': settings.hours_day_color || '#3b3023', '--hours-closed': settings.hours_closed_color || '#8a4c35',
    '--hours-border': settings.hours_border_color || '#e3d7c4', '--hours-icon': settings.hours_icon_color || '#62643e',
    '--hours-icon-bg': settings.hours_icon_bg || '#eeeadc', '--hours-note-bg': settings.hours_note_bg || '#eeeadc',
    '--hours-card-bg': landingCardBackgroundColor('weekly_hours', settings),
    '--hours-mobile-align': ['left', 'center', 'right'].includes(settings.mobile_text_alignment || '') ? settings.mobile_text_alignment : 'left',
    '--hours-desktop-align': ['left', 'center', 'right'].includes(settings.desktop_text_alignment || '') ? settings.desktop_text_alignment : 'left',
    backgroundColor: landingBackgroundColor('weekly_hours', settings),
  } as CSSProperties

  return <section className={`landing-section ${styles.section}`} data-heading-font={headingFont} data-body-font={bodyFont} style={style}>
    <div className={styles.layout}>
      <div className={styles.intro}>
        <span className={styles.icon}><Icon name="clock" className="h-7 w-7" /></span>
        {(settings.hours_eyebrow ?? 'Te esperamos') && <p className={styles.eyebrow}>{settings.hours_eyebrow ?? 'Te esperamos'}</p>}
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {description && <p className={styles.description}>{description}</p>}
        {settings.hours_note && <p className={styles.note}><Icon name="info" className="mt-0.5 h-5 w-5 shrink-0" /><span>{settings.hours_note}</span></p>}
      </div>
      <dl className={styles.schedule}>
        {normalizeWeeklyHours(settings.weekly_hours_days).map(row => {
          const periods = row.periods.filter(validHoursPeriod)
          const confirmed = row.status === 'open' && periods.length === row.periods.length
          return <div key={row.day} className={styles.row}>
            <dt className={styles.day}>{WEEK_DAYS.find(([day]) => day === row.day)![1]}</dt>
            <dd className={styles.times}>{row.status === 'closed' ? <span className={styles.closed}>{settings.hours_closed_label || 'Cerrado'}</span> : confirmed ? periods.map((period, index) => <span key={index} className={styles.period}><time dateTime={period.start}>{period.start}</time><span aria-hidden="true"> – </span><span className="sr-only"> a </span><time dateTime={period.end}>{period.end}</time></span>) : <span className={styles.pending}>{settings.hours_pending_label || 'Horario a confirmar'}</span>}</dd>
          </div>
        })}
      </dl>
    </div>
  </section>
}
