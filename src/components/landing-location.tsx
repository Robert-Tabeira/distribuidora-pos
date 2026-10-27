'use client'

import { useState, type CSSProperties } from 'react'
import { Icon } from '@/components/ui/icon'
import { getSiteFontFamily } from '@/lib/site-fonts'
import { DEFAULT_LOCATION_SETTINGS as defaults, locationBlockData, locationNumber, type LandingLocationSettings, type LocationBusinessInfo } from '@/lib/landing-location'

interface LocationSectionSettings extends LandingLocationSettings {
  heading_font?: string
  body_font?: string
  heading_weight?: string
  body_weight?: string
  mobile_text_alignment?: 'inherit' | 'left' | 'center' | 'right'
  desktop_text_alignment?: 'inherit' | 'left' | 'center' | 'right'
}

interface LocationSectionProps {
  title: string
  subtitle?: string | null
  description?: string | null
  settings: LocationSectionSettings
  business?: LocationBusinessInfo | null
  preview?: boolean
}

export function LandingLocation({ title, subtitle, description, settings, business, preview = false }: LocationSectionProps) {
  const data = locationBlockData(settings, business)
  const [loadedEmbedUrl, setLoadedEmbedUrl] = useState('')
  const mapLoaded = loadedEmbedUrl === data.embedUrl

  const headingFont = settings.heading_font && settings.heading_font !== 'inherit' ? settings.heading_font : 'lora'
  const bodyFont = settings.body_font && settings.body_font !== 'inherit' ? settings.body_font : 'dm_sans'
  const sectionStyle = {
    '--landing-heading-font': getSiteFontFamily(headingFont),
    '--landing-body-font': getSiteFontFamily(bodyFont),
    '--landing-heading-weight': settings.heading_weight || '700',
    '--landing-body-weight': settings.body_weight || '400',
    '--location-map-mobile': `${locationNumber(settings.map_height_mobile, defaults.map_height_mobile, 220, 520)}px`,
    '--location-map-tablet': `${locationNumber(settings.map_height_tablet, defaults.map_height_tablet, 260, 640)}px`,
    '--location-map-desktop': `${locationNumber(settings.map_height_desktop, defaults.map_height_desktop, 300, 720)}px`,
    '--location-title-mobile': `${locationNumber(settings.map_title_size_mobile, defaults.map_title_size_mobile, 24, 52)}px`,
    '--location-title-desktop': `${locationNumber(settings.map_title_size_desktop, defaults.map_title_size_desktop, 28, 72)}px`,
    '--location-body-size': `${locationNumber(settings.map_text_size, defaults.map_text_size, 13, 22)}px`,
    '--location-mobile-align': settings.mobile_text_alignment && settings.mobile_text_alignment !== 'inherit' ? settings.mobile_text_alignment : 'left',
    '--location-desktop-align': settings.desktop_text_alignment && settings.desktop_text_alignment !== 'inherit' ? settings.desktop_text_alignment : 'left',
    color: settings.map_text_color || defaults.map_text_color,
    backgroundColor: settings.map_section_bg || defaults.map_section_bg,
    backgroundImage: 'radial-gradient(ellipse at 0% 100%, rgba(156, 128, 76, 0.09), transparent 42%)',
  } as CSSProperties
  const headingStyle = { color: settings.map_heading_color || defaults.map_heading_color }
  const accent = settings.map_accent_color || defaults.map_accent_color
  const iconStyle = { color: settings.map_icon_color || defaults.map_icon_color, backgroundColor: settings.map_icon_bg || defaults.map_icon_bg }
  const buttonStyle = { color: settings.map_button_color || defaults.map_button_color, backgroundColor: settings.map_button_bg || defaults.map_button_bg }
  const mapFirst = settings.map_side === 'left'
  const mobileFirst = settings.map_mobile_order === 'first'

  return (
    <section data-heading-font={headingFont} data-body-font={bodyFont} className={`landing-section px-4 py-14 sm:px-6 sm:py-16 ${preview ? 'rounded-2xl' : ''}`} style={sectionStyle}>
      <div className="mx-auto max-w-7xl">
        <div className="location-heading mb-7 sm:mb-9">
          {(settings.map_eyebrow ?? defaults.map_eyebrow) && <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: accent }}>{settings.map_eyebrow ?? defaults.map_eyebrow}</p>}
          <h2 className="location-title break-words font-serif font-bold leading-[1.12]" style={headingStyle}>{title}</h2>
          {subtitle && <p className="location-subtitle mt-4 leading-relaxed" style={headingStyle}>{subtitle}</p>}
          {description && <p className="location-copy mt-3 whitespace-pre-line break-words leading-relaxed">{description}</p>}
          <span aria-hidden="true" className="mt-5 inline-block h-0.5 w-14 rounded-full" style={{ backgroundColor: accent }} />
        </div>

        <div className={`grid overflow-hidden rounded-[1.75rem] border shadow-[0_12px_40px_rgba(72,54,31,0.07)] ${mapFirst ? 'md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]' : 'md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]'}`} style={{ borderColor: settings.map_border_color || defaults.map_border_color, backgroundColor: settings.map_card_bg || defaults.map_card_bg }}>
          <div className={`location-copy flex flex-col justify-center p-6 sm:p-8 lg:p-10 ${mobileFirst ? 'order-2' : 'order-1'} ${mapFirst ? 'md:order-2' : 'md:order-1'}`}>
            <span aria-hidden="true" className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={iconStyle}><Icon name="store" className="h-6 w-6" /></span>
            {(settings.map_card_title ?? defaults.map_card_title) && <h3 className="font-serif text-2xl font-bold leading-tight sm:text-3xl" style={headingStyle}>{settings.map_card_title ?? defaults.map_card_title}</h3>}
            {settings.map_card_description && <p className="mt-3 whitespace-pre-line break-words leading-relaxed">{settings.map_card_description}</p>}
            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3">
                <Icon aria-hidden="true" name="location" className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} />
                <div className="min-w-0"><p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: accent }}>Dónde estamos</p><address className="whitespace-pre-line break-words not-italic leading-relaxed">{data.address}</address></div>
              </div>
              {data.hours && <div className="flex items-start gap-3"><Icon aria-hidden="true" name="clock" className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} /><div className="min-w-0"><p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: accent }}>Horarios</p><p className="whitespace-pre-line leading-relaxed">{data.hours}</p></div></div>}
              {data.phone && <div className="flex items-start gap-3"><Icon aria-hidden="true" name="chat" className="mt-0.5 h-5 w-5 shrink-0" style={{ color: accent }} /><div className="min-w-0"><p className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: accent }}>WhatsApp</p>{data.phoneUrl ? <a href={data.phoneUrl} target="_blank" rel="noopener noreferrer" className="break-words leading-relaxed underline-offset-4 hover:underline focus-visible:underline">{data.phone}</a> : <p className="break-words leading-relaxed">{data.phone}</p>}</div></div>}
            </div>
            {(settings.map_link_text ?? defaults.map_link_text) && <a href={data.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full px-6 py-3 font-semibold shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 sm:w-fit" style={buttonStyle}><Icon aria-hidden="true" name="compass" className="h-5 w-5 shrink-0" />{settings.map_link_text ?? defaults.map_link_text}<span aria-hidden="true">↗</span></a>}
          </div>

          <div className={`location-map-frame relative min-w-0 overflow-hidden ${mobileFirst ? 'order-1' : 'order-2'} ${mapFirst ? 'md:order-1' : 'md:order-2'}`} style={{ backgroundColor: settings.map_icon_bg || defaults.map_icon_bg }} aria-busy={!preview && !mapLoaded}>
            <div aria-hidden={!preview && mapLoaded} className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center" style={{ backgroundImage: 'linear-gradient(135deg, transparent 44%, rgba(255,255,255,0.6) 44%, rgba(255,255,255,0.6) 46%, transparent 46%), linear-gradient(35deg, transparent 55%, rgba(255,255,255,0.5) 55%, rgba(255,255,255,0.5) 57%, transparent 57%)' }}>
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-sm" style={{ ...iconStyle, backgroundColor: settings.map_card_bg || defaults.map_card_bg }}><Icon aria-hidden="true" name="location" className="h-8 w-8" /></span>
              <p className="font-serif text-xl font-semibold" style={headingStyle}>{preview ? 'Vista previa del mapa' : 'Encontranos acá'}</p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed">{data.address}</p>
              {preview ? <p className="mt-4 text-xs opacity-75">El mapa interactivo se muestra en la landing.</p> : !mapLoaded && <p role="status" className="mt-4 text-sm">Cargando mapa…</p>}
            </div>
            {!preview && <iframe key={data.embedUrl} title={`Mapa de ubicación: ${data.address}`} src={data.embedUrl} className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-300 ${mapLoaded ? 'opacity-100' : 'opacity-0'}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen onLoad={() => setLoadedEmbedUrl(data.embedUrl)} />}
          </div>
        </div>
      </div>
      <style jsx>{`
        .location-heading { text-align: var(--location-mobile-align); }
        .location-title { font-size: var(--location-title-mobile); }
        .location-copy { font-size: var(--location-body-size); }
        .location-subtitle { font-size: calc(var(--location-body-size) + 2px); }
        .location-map-frame { min-height: var(--location-map-mobile); }
        @media (min-width: 768px) {
          .location-heading { text-align: var(--location-desktop-align); }
          .location-title { font-size: calc((var(--location-title-mobile) + var(--location-title-desktop)) / 2); }
          .location-map-frame { min-height: var(--location-map-tablet); }
        }
        @media (min-width: 1024px) {
          .location-title { font-size: var(--location-title-desktop); }
          .location-map-frame { min-height: var(--location-map-desktop); }
        }
      `}</style>
    </section>
  )
}
