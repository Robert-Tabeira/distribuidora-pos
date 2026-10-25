'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { PublicLayout } from '@/components/public-layout'
import { useRouter } from 'next/navigation'
import { HeroSlider, type HeroSliderInitialData } from '@/components/hero-slider'
import { supabase } from '@/lib/supabase'
import type { Category, Product, Discount } from '@/types/database'
import { Icon } from '@/components/ui/icon'
import { CategoryIconImage } from '@/components/category-icon-image'
import { getCategoryIconName, isCategoryIconImage } from '@/lib/category-icons'
import Link from 'next/link'
import { getSiteFontFamily } from '@/lib/site-fonts'
import { optimizedImageSource, optimizedImageSourceSet, SiteImage } from '@/components/site-image'
import { LandingLocation } from '@/components/landing-location'
import type { LandingLocationSettings } from '@/lib/landing-location'
import { CATEGORY_APPEARANCE_DEFAULTS, CATEGORY_APPEARANCE_COLORS, categoryTitleSize, type LandingCategoryAppearance } from '@/lib/landing-category-appearance'
import { ORDER_INSTRUCTIONS_CONTENT } from '@/lib/landing-order-instructions'
import { SAVED_LISTS_INSTRUCTIONS_CONTENT } from '@/lib/landing-saved-lists-instructions'
import { INSTRUCTION_BACKGROUND_TEXTURE, isInstructionBlock, landingBackgroundColor, type LandingBackgroundSettings } from '@/lib/landing-background'

interface ProductWithDiscount extends Pick<Product, 'id' | 'name' | 'gallery'> {
  discount?: Discount
}

type LandingBlockType = 'content' | 'categories' | 'banner' | 'feature_cards' | 'instructions' | 'order_instructions' | 'saved_lists_instructions' | 'business_info' | 'location_map' | 'image_carousel' | 'product_grid'
interface LandingSectionSettings extends LandingLocationSettings, LandingCategoryAppearance, LandingBackgroundSettings {
  button_text?: string
  button_url?: string
  background_color?: string
  mode?: 'popular' | 'discounts'
  limit?: number
  show_phone?: boolean
  show_email?: boolean
  show_address?: boolean
  show_business_hours?: boolean
  category_icons?: Record<string, string>
  category_order?: string[]
  category_icon_size_desktop?: number
  category_icon_size_mobile?: number
  category_custom_icon_weight?: number
  category_icon_bg_color?: string
  category_icon_color?: string
  category_icon_hover_bg_color?: string
  category_icon_hover_color?: string
  cards?: Array<{ title: string; description: string; image_url: string; mobile_image_url?: string; link_url: string; button_text: string }>
  instruction_steps?: Array<{ title: string; description: string; image_url: string; mobile_image_url?: string }>
  instruction_shipping_visible?: boolean
  instruction_shipping_title?: string
  instruction_shipping_text?: string
  instruction_note_title?: string
  instruction_note?: string
  instruction_section_bg?: string
  instruction_eyebrow_color?: string
  instruction_heading_color?: string
  instruction_subtitle_color?: string
  instruction_description_color?: string
  instruction_accent_color?: string
  instruction_card_bg?: string
  instruction_card_border?: string
  instruction_number_bg?: string
  instruction_number_color?: string
  instruction_step_title_color?: string
  instruction_step_text_color?: string
  instruction_image_bg?: string
  instruction_placeholder_color?: string
  instruction_note_bg?: string
  instruction_note_border?: string
  instruction_note_title_color?: string
  instruction_note_text_color?: string
  instruction_note_icon_color?: string
  instruction_button_bg?: string
  instruction_button_color?: string
  slides?: Array<{ image_url: string; mobile_image_url?: string; link_url: string }>
  mobile_image_url?: string
  desktop_text_alignment?: 'inherit' | 'left' | 'center' | 'right'
  mobile_text_alignment?: 'inherit' | 'left' | 'center' | 'right'
  desktop_image_position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  mobile_image_position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  desktop_image_side?: 'left' | 'right'
  mobile_image_order?: 'first' | 'last'
  heading_font?: string
  body_font?: string
  heading_weight?: string
  body_weight?: string
}
interface LandingSection {
  id: string
  section_name: string
  title: string | null
  subtitle: string | null
  description: string | null
  image_url: string | null
  is_visible: boolean
  block_type: LandingBlockType
  order_position: number
  settings: LandingSectionSettings
}
interface CategoryForLanding extends Category {
  parent_id: string | null
  show_in_catalog: boolean
  color: string | null
}
interface BusinessSettings {
  phone_number: string | null
  email: string | null
  address: string | null
  business_hours: string | null
}

const TEXT_ALIGNMENT_CLASS = { left: 'text-left', center: 'text-center', right: 'text-right' } as const
const DESKTOP_TEXT_ALIGNMENT_CLASS = { left: 'lg:text-left', center: 'lg:text-center', right: 'lg:text-right' } as const
const OBJECT_POSITION_CLASS = { center: 'object-center', top: 'object-top', bottom: 'object-bottom', left: 'object-left', right: 'object-right' } as const
const DESKTOP_OBJECT_POSITION_CLASS = { center: 'lg:object-center', top: 'lg:object-top', bottom: 'lg:object-bottom', left: 'lg:object-left', right: 'lg:object-right' } as const
const MOBILE_IMAGE_ORDER_CLASS = { first: 'order-1', last: 'order-2' } as const
const MOBILE_TEXT_ORDER_CLASS = { first: 'order-2', last: 'order-1' } as const
const DESKTOP_IMAGE_ORDER_CLASS = { left: 'lg:order-1', right: 'lg:order-2' } as const
const DESKTOP_TEXT_ORDER_CLASS = { left: 'lg:order-2', right: 'lg:order-1' } as const

function responsiveTextClasses(settings: LandingSectionSettings, fallback?: 'left' | 'center' | 'right') {
  const mobileAlignment = settings.mobile_text_alignment && settings.mobile_text_alignment !== 'inherit' ? settings.mobile_text_alignment : fallback
  const desktopAlignment = settings.desktop_text_alignment && settings.desktop_text_alignment !== 'inherit' ? settings.desktop_text_alignment : fallback
  const mobile = mobileAlignment ? TEXT_ALIGNMENT_CLASS[mobileAlignment] : ''
  const desktop = desktopAlignment ? DESKTOP_TEXT_ALIGNMENT_CLASS[desktopAlignment] : ''
  return `${mobile} ${desktop}`
}

function ResponsiveImage({ desktopSrc, mobileSrc, alt, className, settings }: { desktopSrc: string; mobileSrc?: string; alt: string; className: string; settings: LandingSectionSettings }) {
  const mobilePosition = OBJECT_POSITION_CLASS[settings.mobile_image_position || 'center']
  const desktopPosition = DESKTOP_OBJECT_POSITION_CLASS[settings.desktop_image_position || 'center']
  return <picture className={`relative block h-full w-full ${className}`}>
    {mobileSrc && <source media="(max-width: 767px)" sizes="100vw" data-original-src={mobileSrc} srcSet={optimizedImageSourceSet(mobileSrc, [384, 640, 750, 828, 1080])} />}
    <SiteImage src={desktopSrc} alt={alt} fill sizes="(max-width: 767px) 100vw, 1280px" quality={75} loading="lazy" className={`${mobilePosition} ${desktopPosition} object-cover`} />
  </picture>
}

function LandingBlockRenderer({
  section,
  categories,
  products,
  businessSettings
}: {
  section: LandingSection
  categories: CategoryForLanding[]
  products: ProductWithDiscount[]
  businessSettings: BusinessSettings | null
}) {
  const instructionDefaults = section.block_type === 'order_instructions' ? ORDER_INSTRUCTIONS_CONTENT.settings : section.block_type === 'saved_lists_instructions' ? SAVED_LISTS_INSTRUCTIONS_CONTENT.settings : {}
  const settings: LandingSectionSettings = { ...instructionDefaults, ...(section.settings || {}) }
  const heading = section.title || section.section_name
  const mobileImageOrder = MOBILE_IMAGE_ORDER_CLASS[settings.mobile_image_order || 'first']
  const mobileTextOrder = MOBILE_TEXT_ORDER_CLASS[settings.mobile_image_order || 'first']
  const desktopImageOrder = DESKTOP_IMAGE_ORDER_CLASS[settings.desktop_image_side || 'left']
  const desktopTextOrder = DESKTOP_TEXT_ORDER_CLASS[settings.desktop_image_side || 'left']
  const headingFont = settings.heading_font && settings.heading_font !== 'inherit' ? settings.heading_font : undefined
  const bodyFont = settings.body_font && settings.body_font !== 'inherit' ? settings.body_font : undefined
  const fontStyle = {
    '--landing-heading-font': getSiteFontFamily(headingFont),
    '--landing-body-font': getSiteFontFamily(bodyFont),
    '--landing-heading-weight': settings.heading_weight || '700',
    '--landing-body-weight': settings.body_weight || '400',
  } as CSSProperties
  const sectionStyle = { ...fontStyle, backgroundColor: landingBackgroundColor(section.block_type, settings) }
  const categoryIconStyle = {
    '--category-icon-size-mobile': `${settings.category_icon_size_mobile || 44}px`,
    '--category-icon-size-desktop': `${settings.category_icon_size_desktop || 44}px`,
    '--category-custom-icon-expansion': `${(settings.category_custom_icon_weight || 0) / 2}px`,
    '--category-icon-bg': settings.category_icon_bg_color || '#f2e9e3',
    '--category-icon-color': settings.category_icon_color || '#8b4a2f',
    '--category-icon-hover-bg': settings.category_icon_hover_bg_color || '#8b4a2f',
    '--category-icon-hover-color': settings.category_icon_hover_color || '#ffffff',
  } as CSSProperties

  if (section.block_type === 'categories') {
    const visibleCategories = categories.filter(category => category.show_in_catalog !== false)
    const defaultOrder = visibleCategories.filter(category => !category.parent_id).map(category => category.id)
    const categoryOrder = settings.category_order ?? defaultOrder
    const displayedCategories = categoryOrder
      .map(id => visibleCategories.find(category => category.id === id))
      .filter((category): category is CategoryForLanding => Boolean(category))
    if (displayedCategories.length === 0) return null
    const appearance = { ...CATEGORY_APPEARANCE_DEFAULTS, ...settings }
    const categoryStyle = {
      ...sectionStyle,
      ...categoryIconStyle,
      ...Object.fromEntries(CATEGORY_APPEARANCE_COLORS.map(([key]) => [`--${key.replaceAll('_', '-')}`, settings[key] || CATEGORY_APPEARANCE_DEFAULTS[key]])),
      '--landing-heading-font': getSiteFontFamily(headingFont || 'lora'),
      '--landing-body-font': getSiteFontFamily(bodyFont || 'dm_sans'),
      '--category-title-mobile': `${categoryTitleSize(settings.category_title_size_mobile, CATEGORY_APPEARANCE_DEFAULTS.category_title_size_mobile)}px`,
      '--category-title-desktop': `${categoryTitleSize(settings.category_title_size_desktop, CATEGORY_APPEARANCE_DEFAULTS.category_title_size_desktop)}px`,
    } as CSSProperties
    return (
      <section data-heading-font={headingFont || 'lora'} data-body-font={bodyFont || 'dm_sans'} style={categoryStyle} className={`landing-section landing-categories px-4 py-14 sm:px-6 sm:py-16 ${responsiveTextClasses(settings)}`}>
        <div className="mx-auto max-w-7xl">
          <div className={`mx-auto max-w-3xl ${responsiveTextClasses(settings, 'center')}`}>
            {appearance.category_eyebrow && <p className="landing-categories-eyebrow mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]">{appearance.category_eyebrow}</p>}
            <h2 className="landing-categories-title font-bold leading-tight">{heading}</h2>
            {section.subtitle && <p className="landing-categories-subtitle mt-3 text-base leading-relaxed sm:text-lg">{section.subtitle}</p>}
            {section.description && <p className="landing-categories-description mt-3 whitespace-pre-line text-sm leading-7 sm:text-base">{section.description}</p>}
            <span className="landing-categories-rule mt-5 inline-block h-0.5 w-12 rounded-full" aria-hidden="true" />
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 xl:grid-cols-6">
            {displayedCategories.map(category => (
              <Link key={category.id} href={`/catalogo?categoria=${encodeURIComponent(category.id)}`} className="category-card landing-category-card group flex min-h-36 min-w-0 flex-col items-center justify-center gap-4 rounded-2xl border p-4 text-center sm:p-5">
                <span className="category-icon-container flex items-center justify-center overflow-hidden rounded-full transition-colors">
                  {isCategoryIconImage(settings.category_icons?.[category.id])
                    ? <CategoryIconImage src={settings.category_icons[category.id]} weight={settings.category_custom_icon_weight || 0} />
                    : <Icon name={getCategoryIconName(category.name, settings.category_icons?.[category.id])} className="category-icon-glyph" />}
                </span>
                <span className="text-sm font-semibold leading-snug">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (isInstructionBlock(section.block_type)) {
    const steps = (settings.instruction_steps || []).filter(step => Boolean(step && (step.title || step.description || step.image_url)))
    return (
      <section
        data-heading-font={headingFont}
        data-body-font={bodyFont}
        style={{
          ...sectionStyle,
          backgroundImage: settings.instruction_texture_enabled === false ? 'none' : INSTRUCTION_BACKGROUND_TEXTURE,
        }}
        className={`landing-section px-4 py-14 text-[#21170f] sm:px-6 sm:py-16 ${responsiveTextClasses(settings, 'left')}`}
      >
        <div className="mx-auto max-w-7xl">
          <div className={responsiveTextClasses(settings, 'left')}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: settings.instruction_eyebrow_color || '#706b45' }}>Rápido <span className="mx-2" style={{ color: settings.instruction_accent_color || '#b58b5d' }}>/</span> Simple <span className="mx-2" style={{ color: settings.instruction_accent_color || '#b58b5d' }}>/</span> Sin complicaciones</p>
            <h2 className="max-w-4xl text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl" style={{ color: settings.instruction_heading_color || '#241a12' }}>{heading}</h2>
            {section.subtitle && <p className="mt-4 max-w-3xl text-lg font-semibold sm:text-xl" style={{ color: settings.instruction_subtitle_color || '#5d573b' }}>{section.subtitle}</p>}
            {section.description && <p className="mt-2 max-w-3xl whitespace-pre-line text-base leading-7 sm:text-lg" style={{ color: settings.instruction_description_color || '#39332c' }}>{section.description}</p>}
            <div className="mt-4 h-[2px] w-14 rounded-full" style={{ backgroundColor: settings.instruction_accent_color || '#68663e' }} />
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <div key={`${section.id}-instruction-${index}`} className="relative">
                <article className="flex h-full flex-col overflow-hidden rounded-[1.6rem] border shadow-[0_8px_24px_rgba(72,54,31,0.08)]" style={{ backgroundColor: settings.instruction_card_bg || '#fffdf8', borderColor: settings.instruction_card_border || '#e4dac7' }}>
                  <div className="flex items-start gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-serif text-3xl shadow-inner sm:h-16 sm:w-16 sm:text-4xl" style={{ backgroundColor: settings.instruction_number_bg || '#62613b', color: settings.instruction_number_color || '#fffdf8' }}>{index + 1}</span>
                    <div className="pt-0.5">
                      <h3 className="text-xl font-bold leading-tight sm:text-2xl" style={{ color: settings.instruction_step_title_color || '#21170f' }}>{step.title || `Paso ${index + 1}`}</h3>
                      {step.description && <p className="mt-3 text-sm leading-6 sm:text-base" style={{ color: settings.instruction_step_text_color || '#49433b' }}>{step.description}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-1 items-center justify-center px-4 pb-4 sm:px-5 sm:pb-5">
                    {step.image_url
                      ? <picture className="block w-full overflow-hidden rounded-2xl" style={{ backgroundColor: settings.instruction_image_bg || '#f5f0e6' }}>
                          {step.mobile_image_url && <source media="(max-width: 767px)" sizes="calc(100vw - 64px)" data-original-src={step.mobile_image_url} srcSet={optimizedImageSourceSet(step.mobile_image_url, [384, 640, 750, 828, 1080])} />}
                          <img
                            src={optimizedImageSource(step.image_url, 828)}
                            srcSet={optimizedImageSourceSet(step.image_url, [384, 640, 750, 828, 1080, 1200])}
                            sizes="(max-width: 767px) calc(100vw - 64px), (max-width: 1328px) calc((100vw - 232px) / 3), 366px"
                            alt={step.title || `Imagen del paso ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                            onError={event => {
                              const image = event.currentTarget
                              if (image.dataset.originalFallback !== 'true' && image.src !== step.image_url) {
                                image.dataset.originalFallback = 'true'
                                image.removeAttribute('srcset')
                                image.closest('picture')?.querySelectorAll<HTMLSourceElement>('source[data-original-src]').forEach(source => {
                                  source.srcset = source.dataset.originalSrc || ''
                                })
                                image.src = step.image_url
                              }
                            }}
                            className="mx-auto block h-auto max-h-[340px] w-full object-contain"
                          />
                        </picture>
                      : <div className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d9ceb9] sm:min-h-48" style={{ backgroundColor: settings.instruction_image_bg || '#f8f4eb', color: settings.instruction_placeholder_color || '#a99a7c' }}><Icon name="image" className="h-8 w-8" /><span className="text-xs font-medium">Imagen del paso {index + 1}</span></div>}
                  </div>
                </article>
                {index < steps.length - 1 && <span aria-hidden="true" className="absolute -right-[1.65rem] top-1/2 z-10 hidden -translate-y-1/2 text-3xl md:block" style={{ color: settings.instruction_accent_color || '#353321' }}>→</span>}
              </div>
            ))}
          </div>
          {section.block_type === 'order_instructions' && settings.instruction_shipping_visible !== false && (settings.instruction_shipping_title || settings.instruction_shipping_text) && <div className="mt-7 flex items-start gap-4 rounded-[1.6rem] border p-5 sm:gap-5 sm:p-6" style={{ backgroundColor: settings.instruction_note_bg || '#fffdf8', borderColor: settings.instruction_note_border || '#e3d8c4' }}>
            <Icon name="location" aria-hidden="true" className="mt-1 h-7 w-7 shrink-0" style={{ color: settings.instruction_note_icon_color || '#4f4e30' }} />
            <div className="min-w-0">
              {settings.instruction_shipping_title && <h3 className="text-xl font-bold sm:text-2xl" style={{ color: settings.instruction_note_title_color || '#21170f' }}>{settings.instruction_shipping_title}</h3>}
              {settings.instruction_shipping_text && <p className="mt-2 whitespace-pre-line text-sm leading-6 sm:text-base" style={{ color: settings.instruction_note_text_color || '#49433b' }}>{settings.instruction_shipping_text}</p>}
            </div>
          </div>}
          {(settings.instruction_note_title || settings.instruction_note || settings.button_text) && <div className="mt-7 flex flex-col gap-5 rounded-[1.8rem] border p-5 shadow-[0_8px_24px_rgba(72,54,31,0.07)] sm:p-6 lg:flex-row lg:items-center lg:gap-7" style={{ backgroundColor: settings.instruction_note_bg || '#fffdf8', borderColor: settings.instruction_note_border || '#e3d8c4' }}>
            {(settings.instruction_note_title || settings.instruction_note) && <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
              <Icon name="sparkles" className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" style={{ color: settings.instruction_note_icon_color || '#4f4e30' }} />
              <span aria-hidden="true" className="hidden h-12 w-px bg-[#b9aa8e] sm:block" />
              <div>{settings.instruction_note_title && <h3 className="font-serif text-xl font-bold leading-tight sm:text-2xl" style={{ color: settings.instruction_note_title_color || '#21170f' }}>{settings.instruction_note_title}</h3>}{settings.instruction_note && <p className="mt-1 text-sm leading-6 sm:text-base" style={{ color: settings.instruction_note_text_color || '#49433b' }}>{settings.instruction_note}</p>}</div>
            </div>}
            {settings.button_text && <Link href={settings.button_url || '/catalogo'} className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full px-6 py-3.5 font-bold shadow-sm transition hover:-translate-y-0.5 hover:brightness-90 sm:px-7" style={{ backgroundColor: settings.instruction_button_bg || '#525333', color: settings.instruction_button_color || '#ffffff' }}>{settings.button_text}<span aria-hidden="true" className="text-xl">→</span></Link>}
          </div>}
        </div>
      </section>
    )
  }

  if (section.block_type === 'banner') {
    return (
      <section data-heading-font={headingFont} data-body-font={bodyFont} style={sectionStyle} className={`landing-section px-4 py-10 ${responsiveTextClasses(settings)}`}>
        <div style={{ backgroundColor: settings.card_background_color }} className={`mx-auto flex max-w-7xl flex-col overflow-hidden rounded-3xl bg-white/60 shadow-sm lg:flex-row ${section.image_url ? 'items-stretch' : 'items-center text-center'}`}>
          {section.image_url && <div className={`w-full lg:w-2/5 ${mobileImageOrder} ${desktopImageOrder}`}><ResponsiveImage desktopSrc={section.image_url} mobileSrc={settings.mobile_image_url} alt={heading} settings={settings} className="max-h-72 min-h-48 w-full object-cover" /></div>}
          <div className={`flex flex-1 flex-col items-center justify-center p-7 lg:p-10 ${section.image_url ? `${mobileTextOrder} ${desktopTextOrder}` : ''}`}>
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">{heading}</h2>
            {section.subtitle && <p className="mt-2 text-lg font-semibold text-gray-700">{section.subtitle}</p>}
            {section.description && <p className="mt-3 max-w-2xl whitespace-pre-line text-gray-600">{section.description}</p>}
            {settings.button_text && <Link href={settings.button_url || '/catalogo'} className="mt-5 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-sm transition hover:brightness-95">{settings.button_text}</Link>}
          </div>
        </div>
      </section>
    )
  }

  if (section.block_type === 'feature_cards') {
    return (
      <section data-heading-font={headingFont} data-body-font={bodyFont} style={sectionStyle} className={`landing-section px-4 py-14 ${responsiveTextClasses(settings)}`}>
        <div className="mx-auto max-w-7xl">
          <h2 className={`text-3xl font-bold text-gray-900 sm:text-4xl ${responsiveTextClasses(settings, 'center')}`}>{heading}</h2>
          {section.subtitle && <p className={`mt-2 text-gray-600 ${responsiveTextClasses(settings, 'center')}`}>{section.subtitle}</p>}
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {(settings.cards || []).filter(card => card.title || card.image_url || card.description).map((card, index) => (
              <article key={`${section.id}-${index}`} style={{ backgroundColor: settings.card_background_color }} className={`flex flex-col overflow-hidden rounded-2xl border border-[#e7d9c8] bg-white shadow-sm ${settings.desktop_image_side ? 'lg:flex-row' : ''}`}>
                {card.image_url && <div className={`${mobileImageOrder} ${settings.desktop_image_side ? `${desktopImageOrder} lg:w-2/5` : ''}`}><ResponsiveImage desktopSrc={card.image_url} mobileSrc={card.mobile_image_url} alt={card.title} settings={settings} className="h-56 w-full object-cover" /></div>}
                <div className={`p-6 ${settings.desktop_image_side ? `${mobileTextOrder} ${desktopTextOrder} lg:flex-1` : ''}`}>
                  <h3 className="text-xl font-bold text-gray-900">{card.title}</h3>
                  {card.description && <p className="mt-2 whitespace-pre-line leading-6 text-gray-600">{card.description}</p>}
                  {card.button_text && <Link href={card.link_url || '/catalogo'} className="mt-4 inline-flex font-semibold text-primary hover:underline">{card.button_text}<span className="ml-1" aria-hidden="true">→</span></Link>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (section.block_type === 'business_info') {
    const details = [
      settings.show_business_hours !== false && businessSettings?.business_hours ? { icon: 'clock' as const, label: 'Horarios', value: businessSettings.business_hours } : null,
      settings.show_address !== false && businessSettings?.address ? { icon: 'location' as const, label: 'Ubicación', value: businessSettings.address } : null,
      settings.show_phone !== false && businessSettings?.phone_number ? { icon: 'phone' as const, label: 'Contacto', value: businessSettings.phone_number, href: `https://wa.me/${businessSettings.phone_number.replace(/\D/g, '')}` } : null,
      settings.show_email !== false && businessSettings?.email ? { icon: 'mail' as const, label: 'Email', value: businessSettings.email, href: `mailto:${businessSettings.email}` } : null
    ].filter(Boolean) as Array<{ icon: 'clock' | 'location' | 'phone' | 'mail'; label: string; value: string; href?: string }>
    return (
      <section data-heading-font={headingFont} data-body-font={bodyFont} style={sectionStyle} className={`landing-section px-4 py-14 ${responsiveTextClasses(settings)}`}>
        <div className="mx-auto max-w-6xl">
          <h2 className={`text-3xl font-bold text-gray-900 sm:text-4xl ${responsiveTextClasses(settings, 'center')}`}>{heading}</h2>
          {section.subtitle && <p className={`mt-2 text-gray-600 ${responsiveTextClasses(settings, 'center')}`}>{section.subtitle}</p>}
          {section.description && <p className={`mx-auto mt-4 max-w-3xl whitespace-pre-line text-gray-600 ${responsiveTextClasses(settings, 'center')}`}>{section.description}</p>}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {details.map(detail => (
              <div key={detail.label} style={{ backgroundColor: settings.card_background_color }} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <Icon name={detail.icon} className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-bold text-gray-900">{detail.label}</h3>
                {detail.href ? <a href={detail.href} className="mt-1 block whitespace-pre-line text-sm text-gray-600 hover:text-primary">{detail.value}</a> : <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{detail.value}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (section.block_type === 'location_map') {
    return <LandingLocation title={heading} subtitle={section.subtitle} description={section.description} settings={{ ...settings, map_section_bg: landingBackgroundColor(section.block_type, settings) }} business={businessSettings} />
  }

  if (section.block_type === 'image_carousel') {
    const slides = (settings.slides || []).filter(slide => slide.image_url)
    if (slides.length === 0) return null
    return (
      <section data-heading-font={headingFont} data-body-font={bodyFont} style={sectionStyle} className={`landing-section px-4 py-14 ${responsiveTextClasses(settings)}`}>
        <div className="mx-auto max-w-7xl">
          <h2 className={`text-3xl font-bold text-gray-900 sm:text-4xl ${responsiveTextClasses(settings, 'center')}`}>{heading}</h2>
          {section.subtitle && <p className={`mt-2 text-gray-600 ${responsiveTextClasses(settings, 'center')}`}>{section.subtitle}</p>}
          {section.description && <p className={`mt-3 text-gray-600 ${responsiveTextClasses(settings, 'center')}`}>{section.description}</p>}
          <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4">
            {slides.map((slide, index) => (
              <a key={`${section.id}-${index}`} href={slide.link_url || undefined} className="w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#e7d9c8] shadow-sm sm:w-[46%] lg:w-[30%]">
                <ResponsiveImage desktopSrc={slide.image_url} mobileSrc={slide.mobile_image_url} alt={`${heading} ${index + 1}`} settings={settings} className="h-56 w-full object-cover transition hover:scale-[1.02]" />
              </a>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (section.block_type === 'product_grid') {
    const shownProducts = settings.mode === 'discounts' ? products.filter(product => product.discount) : products
    if (shownProducts.length === 0) return null
    return (
      <section data-heading-font={headingFont} data-body-font={bodyFont} style={sectionStyle} className={`landing-section px-4 py-14 ${responsiveTextClasses(settings)}`}>
        <div className="mx-auto max-w-7xl">
          <h2 className={`text-3xl font-bold text-gray-900 sm:text-4xl ${responsiveTextClasses(settings, 'center')}`}>{heading}</h2>
          {section.subtitle && <p className={`mt-2 text-gray-600 ${responsiveTextClasses(settings, 'center')}`}>{section.subtitle}</p>}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {shownProducts.slice(0, settings.limit || 5).map(product => (
              <Link key={product.id} href="/catalogo" style={{ backgroundColor: settings.card_background_color }} className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
                <div className="h-36 bg-gray-100 md:h-44">{product.gallery?.[0] ? <ResponsiveImage desktopSrc={product.gallery[0]} alt={product.name} settings={settings} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-300"><Icon name="box" className="h-9 w-9" /></div>}</div>
                <div className="p-3"><h3 className="line-clamp-2 text-sm font-bold text-gray-900">{product.name}</h3>{product.discount && <p className="mt-1 text-xs font-semibold text-red-600">{product.discount.name}</p>}</div>
              </Link>
            ))}
          </div>
          {settings.button_text && <div className={`mt-8 ${responsiveTextClasses(settings, 'center')}`}><Link href={settings.button_url || '/catalogo'} className="inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:brightness-95">{settings.button_text}</Link></div>}
        </div>
      </section>
    )
  }

  return (
      <section data-heading-font={headingFont} data-body-font={bodyFont} style={sectionStyle} className={`landing-section px-4 py-14 ${responsiveTextClasses(settings)}`}>
      <div className={`mx-auto grid max-w-6xl items-center gap-8 ${section.image_url ? 'lg:grid-cols-2' : 'max-w-4xl text-center'}`}>
        {section.image_url && <div className={`${mobileImageOrder} ${desktopImageOrder}`}><ResponsiveImage desktopSrc={section.image_url} mobileSrc={settings.mobile_image_url} alt={heading} settings={settings} className="max-h-[28rem] min-h-56 w-full rounded-2xl object-cover" /></div>}
        <div className={`${section.image_url ? `${mobileTextOrder} ${desktopTextOrder}` : ''}`}><h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">{heading}</h2>{section.subtitle && <p className="mt-3 text-lg font-medium text-primary">{section.subtitle}</p>}{section.description && <p className="mt-4 whitespace-pre-line leading-7 text-gray-600">{section.description}</p>}</div>
      </div>
    </section>
  )
}

export default function LandingContent({ initialHero }: { initialHero: HeroSliderInitialData | null }) {
  const [products, setProducts] = useState<ProductWithDiscount[]>([])
  const [landingSections, setLandingSections] = useState<LandingSection[]>([])
  const [categories, setCategories] = useState<CategoryForLanding[]>([])
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [sectionsRes, categoriesRes, settingsRes] = await Promise.all([
        supabase.from('landing_sections').select('*').order('order_position').order('section_name'),
        supabase.from('categories').select('*').order('order_position'),
        supabase.from('website_settings').select('phone_number,email,address,business_hours').single()
      ])

      if (sectionsRes.data) setLandingSections((sectionsRes.data as LandingSection[]).filter(section => section.is_visible))
      if (categoriesRes.data) setCategories(categoriesRes.data as CategoryForLanding[])
      if (settingsRes.data) setBusinessSettings(settingsRes.data as BusinessSettings)

      const visibleSections = ((sectionsRes.data || []) as LandingSection[]).filter(section => section.is_visible)
      const productSections = visibleSections.filter(section => section.block_type === 'product_grid')
      if (productSections.length === 0) return

      setLandingSections(visibleSections)
      const productLimit = Math.min(24, Math.max(1, ...productSections.map(section => section.settings?.limit || 5)))
      const hasDiscountSection = productSections.some(section => section.settings?.mode === 'discounts')

      if (hasDiscountSection) {
        const [discountsRes, productDiscountsRes] = await Promise.all([
          supabase.from('discounts').select('*').eq('is_active', true),
          supabase.from('product_discounts').select('product_id,discount_id')
        ])
        const activeDiscounts = discountsRes.data || []
        const activeDiscountIds = new Set(activeDiscounts.map(discount => discount.id))
        const productDiscounts = productDiscountsRes.data || []
        const discountedProductIds = [...new Set(productDiscounts.filter(item => activeDiscountIds.has(item.discount_id)).map(item => item.product_id))]
        const normalSection = productSections.some(section => section.settings?.mode !== 'discounts')
        const [normalProductsRes, discountedProductsRes] = await Promise.all([
          normalSection
            ? supabase.from('products').select('id,name,gallery').eq('status', 'complete').limit(productLimit)
            : Promise.resolve({ data: [] }),
          discountedProductIds.length
            ? supabase.from('products').select('id,name,gallery').eq('status', 'complete').in('id', discountedProductIds).limit(productLimit)
            : Promise.resolve({ data: [] })
        ])
        const productsById = new Map([...(normalProductsRes.data || []), ...(discountedProductsRes.data || [])].map(product => [product.id, product]))
        const discountById = new Map(activeDiscounts.map(discount => [discount.id, discount]))
        const discountByProductId = new Map(productDiscounts.map(item => [item.product_id, discountById.get(item.discount_id)]))
        setProducts([...productsById.values()].map(product => ({ ...product, discount: discountByProductId.get(product.id) })) as ProductWithDiscount[])
      } else {
        const { data } = await supabase.from('products').select('id,name,gallery').eq('status', 'complete').limit(productLimit)
        setProducts((data || []) as ProductWithDiscount[])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  return (
    <PublicLayout>
    <div className="min-h-screen bg-white">
      {/* HERO SLIDER */}
      <HeroSlider initialData={initialHero} />

      {/* BLOQUES EDITABLES DE LANDING */}
      {landingSections.map(section => (
        <LandingBlockRenderer key={section.id} section={section} categories={categories} products={products} businessSettings={businessSettings} />
      ))}

    </div>
    </PublicLayout>
  )
}
