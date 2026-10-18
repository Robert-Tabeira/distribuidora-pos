'use client'

import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getSiteFontFamily } from '@/lib/site-fonts'

interface HeroSlide {
  id: string
  internal_name?: string
  title: string | null
  description: string | null
  cta_text: string | null
  cta_url: string | null
  cta_bottom_offset?: number | null
  is_active: boolean
  order_position: number
  image_url: string
  mobile_image_url?: string | null
  desktop_text_position?: 'left' | 'center' | 'right' | null
  mobile_text_position?: 'left' | 'center' | 'right' | null
  desktop_image_position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | null
  mobile_image_position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | null
  desktop_image_fit?: 'cover' | 'contain' | null
  mobile_image_fit?: 'cover' | 'contain' | null
  title_font?: string | null
  body_font?: string | null
  title_font_weight?: number | null
  body_font_weight?: number | null
  title_size_desktop?: number | null
  title_size_mobile?: number | null
  body_size_desktop?: number | null
  body_size_mobile?: number | null
  image_darkness?: number | null
  show_title_mobile?: boolean | null
  show_title_desktop?: boolean | null
  show_description_mobile?: boolean | null
  show_description_desktop?: boolean | null
}

const HORIZONTAL_POSITION = { left: 'justify-start', center: 'justify-center', right: 'justify-end' } as const
const DESKTOP_HORIZONTAL_POSITION = { left: 'lg:justify-start', center: 'lg:justify-center', right: 'lg:justify-end' } as const
const IMAGE_POSITION = { center: 'object-center', top: 'object-top', bottom: 'object-bottom', left: 'object-left', right: 'object-right' } as const
const DESKTOP_IMAGE_POSITION = { center: 'lg:object-center', top: 'lg:object-top', bottom: 'lg:object-bottom', left: 'lg:object-left', right: 'lg:object-right' } as const
const IMAGE_FIT = { cover: 'object-cover', contain: 'object-contain' } as const
const DESKTOP_IMAGE_FIT = { cover: 'lg:object-cover', contain: 'lg:object-contain' } as const
const TEXT_ALIGNMENT = { left: 'text-left', center: 'text-center', right: 'text-right' } as const
const DESKTOP_TEXT_ALIGNMENT = { left: 'lg:text-left', center: 'lg:text-center', right: 'lg:text-right' } as const
const responsiveVisibility = (mobileVisible?: boolean | null, desktopVisible?: boolean | null) => {
  if (mobileVisible === false && desktopVisible === false) return 'hidden'
  if (mobileVisible === false) return 'hidden md:block'
  if (desktopVisible === false) return 'block md:hidden'
  return 'block'
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: '1',
    title: 'Los mejores productos de la línea Sarubbi y más',
    description: 'Distribuidora oficial de Sarubbi. Entregas rápidas, precios mayoristas y atención personalizada 24/7.',
    cta_text: 'Ver Catálogo',
    cta_url: '/catalogo',
    is_active: true,
    order_position: 0,
    image_url: 'https://images.unsplash.com/photo-1488459716781-6bffb9a4c200?w=1200&h=600&fit=crop'
  },
  {
    id: '2',
    title: 'Productos Frescos y de Calidad',
    description: 'Seleccionamos cuidadosamente cada producto para garantizar la mejor experiencia.',
    cta_text: 'Explorar',
    cta_url: '/catalogo',
    is_active: true,
    order_position: 1,
    image_url: 'https://images.unsplash.com/photo-1460066672867-888db8d37e39?w=1200&h=600&fit=crop'
  },
  {
    id: '3',
    title: 'Ofertas Especiales Disponibles',
    description: 'Descuentos hasta el 50% en productos seleccionados. ¡Aprovecha ahora!',
    cta_text: 'Ver Ofertas',
    cta_url: '/catalogo',
    is_active: true,
    order_position: 2,
    image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=600&fit=crop'
  }
]

export function HeroSlider() {
  const router = useRouter()
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [loading, setLoading] = useState(true)
  const [autoPlaySeconds, setAutoPlaySeconds] = useState(5)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    loadSlides()
    loadAutoPlaySettings()
    
    // Recargar cada 5 segundos para ver cambios en tiempo real
    const interval = setInterval(() => {
      loadSlides()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  async function loadAutoPlaySettings() {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('hero_autoplay_seconds')
        .single()
      if (error) throw error
      if (data?.hero_autoplay_seconds) {
        setAutoPlaySeconds(Math.min(15, Math.max(2, data.hero_autoplay_seconds)))
      }
    } catch (error) {
      console.error('Error loading hero autoplay interval:', error)
    }
  }

  async function loadSlides() {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('order_position')

      if (error) {
        console.error('Error loading slides:', error)
        setSlides(DEFAULT_SLIDES)
      } else if (data && data.length > 0) {
        console.log('Slides cargados:', data)
        setSlides(data as HeroSlide[])
      } else {
        console.log('No slides found, usando defaults')
        setSlides(DEFAULT_SLIDES)
      }
    } catch (error) {
      console.error('Error loading hero slides:', error)
      setSlides(DEFAULT_SLIDES)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAutoPlay || slides.length === 0) return

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, autoPlaySeconds * 1000)

    return () => clearInterval(interval)
  }, [isAutoPlay, slides.length, autoPlaySeconds])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)
  }

  if (loading || slides.length === 0) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-pulse mb-4">Cargando...</div>
        </div>
      </div>
    )
  }

  const currentSlideData = slides[currentSlide]

  return (
    <div
      className="group relative h-screen w-full overflow-hidden bg-stone-900 transition-all duration-1000"
      onTouchStart={event => { touchStartX.current = event.changedTouches[0]?.clientX ?? null }}
      onTouchEnd={event => {
        const startX = touchStartX.current
        touchStartX.current = null
        if (startX === null) return
        const distance = event.changedTouches[0].clientX - startX
        if (Math.abs(distance) < 50) return
        setCurrentSlide(index => (index + (distance < 0 ? 1 : -1) + slides.length) % slides.length)
      }}
    >
      <picture className="absolute inset-0 block">
        {currentSlideData.mobile_image_url && <source media="(max-width: 767px)" srcSet={currentSlideData.mobile_image_url} />}
        <img
          src={currentSlideData.image_url}
          alt=""
          aria-hidden="true"
          className={`h-full w-full ${IMAGE_FIT[currentSlideData.mobile_image_fit || 'contain']} ${DESKTOP_IMAGE_FIT[currentSlideData.desktop_image_fit || 'contain']} ${IMAGE_POSITION[currentSlideData.mobile_image_position || 'center']} ${DESKTOP_IMAGE_POSITION[currentSlideData.desktop_image_position || 'center']}`}
        />
      </picture>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-black"
        style={{ opacity: (currentSlideData.image_darkness ?? 18) / 100 }}
      />
      {/* Content */}
      <div className="pointer-events-none absolute inset-0">
        <div className={`mx-auto flex h-full w-full max-w-7xl items-center px-4 sm:px-6 ${HORIZONTAL_POSITION[currentSlideData.mobile_text_position || 'left']} ${DESKTOP_HORIZONTAL_POSITION[currentSlideData.desktop_text_position || 'left']}`}>
          <div className={`w-full max-w-2xl ${TEXT_ALIGNMENT[currentSlideData.mobile_text_position || 'left']} ${DESKTOP_TEXT_ALIGNMENT[currentSlideData.desktop_text_position || 'left']}`}>
            {currentSlideData.title && (
              <h1 style={{ fontFamily: getSiteFontFamily(currentSlideData.title_font || 'lora'), fontWeight: currentSlideData.title_font_weight || 900, '--hero-title-mobile': `${currentSlideData.title_size_mobile || 48}px`, '--hero-title-desktop': `${currentSlideData.title_size_desktop || 72}px` } as CSSProperties} className={`hero-title font-black text-white leading-tight mb-6 animate-fade-in drop-shadow-lg ${responsiveVisibility(currentSlideData.show_title_mobile, currentSlideData.show_title_desktop)}`}>
                {currentSlideData.title}
              </h1>
            )}
            {currentSlideData.description && (
              <p style={{ fontFamily: getSiteFontFamily(currentSlideData.body_font || 'dm_sans'), fontWeight: currentSlideData.body_font_weight || 400, '--hero-body-mobile': `${currentSlideData.body_size_mobile || 20}px`, '--hero-body-desktop': `${currentSlideData.body_size_desktop || 24}px` } as CSSProperties} className={`hero-description text-white/95 mb-8 leading-relaxed animate-fade-in-delay drop-shadow-md ${responsiveVisibility(currentSlideData.show_description_mobile, currentSlideData.show_description_desktop)}`}>
                {currentSlideData.description}
              </p>
            )}
            {currentSlideData.cta_text && currentSlideData.cta_url && currentSlideData.cta_bottom_offset == null && (
              <button
                onClick={() => router.push(currentSlideData.cta_url!)}
                style={{ fontFamily: getSiteFontFamily(currentSlideData.body_font || 'dm_sans'), fontWeight: currentSlideData.body_font_weight || 400 }}
                className="pointer-events-auto inline-block px-8 py-4 bg-[#f8efe2] text-[#4b2e20] rounded-xl font-bold hover:bg-white transition-all text-lg animate-fade-in-delay-2 shadow-lg"
              >
                {currentSlideData.cta_text}
              </button>
            )}
          </div>
        </div>
      </div>
      {currentSlideData.cta_text && currentSlideData.cta_url && currentSlideData.cta_bottom_offset != null && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex px-4 sm:px-6"
          style={{ bottom: `${currentSlideData.cta_bottom_offset}px` }}
        >
          <div className={`mx-auto flex w-full max-w-7xl ${HORIZONTAL_POSITION[currentSlideData.mobile_text_position || 'left']} ${DESKTOP_HORIZONTAL_POSITION[currentSlideData.desktop_text_position || 'left']}`}>
            <button
              onClick={() => router.push(currentSlideData.cta_url!)}
              style={{ fontFamily: getSiteFontFamily(currentSlideData.body_font || 'dm_sans'), fontWeight: currentSlideData.body_font_weight || 400 }}
              className="pointer-events-auto inline-block rounded-xl bg-[#f8efe2] px-8 py-4 text-lg font-bold text-[#4b2e20] shadow-lg transition-all hover:bg-white animate-fade-in-delay-2"
            >
              {currentSlideData.cta_text}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 hidden w-12 h-12 lg:flex lg:w-16 lg:h-16 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 hidden w-12 h-12 lg:flex lg:w-16 lg:h-16 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all rounded-full ${
              index === currentSlide
                ? 'w-8 h-3 bg-white'
                : 'w-3 h-3 bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      {isAutoPlay && (
        <div className="absolute bottom-8 right-8 z-20 flex items-center gap-2 text-white text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Auto
        </div>
      )}
    </div>
  )
}
