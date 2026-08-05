'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface HeroSlide {
  id: string
  title: string
  description: string | null
  cta_text: string | null
  cta_url: string | null
  is_active: boolean
  order_position: number
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: '1',
    title: 'Los mejores productos de la línea Sarubbi y más',
    description: 'Distribuidora oficial de Sarubbi. Entregas rápidas, precios mayoristas y atención personalizada 24/7.',
    cta_text: 'Ver Catálogo',
    cta_url: '/catalogo',
    is_active: true,
    order_position: 0
  },
  {
    id: '2',
    title: 'Productos Frescos y de Calidad',
    description: 'Seleccionamos cuidadosamente cada producto para garantizar la mejor experiencia.',
    cta_text: 'Explorar',
    cta_url: '/catalogo',
    is_active: true,
    order_position: 1
  },
  {
    id: '3',
    title: 'Ofertas Especiales Disponibles',
    description: 'Descuentos hasta el 50% en productos seleccionados. ¡Aprovecha ahora!',
    cta_text: 'Ver Ofertas',
    cta_url: '/catalogo',
    is_active: true,
    order_position: 2
  }
]

const GRADIENT_COLORS = [
  'from-blue-900 via-blue-800 to-blue-900',
  'from-indigo-900 via-purple-800 to-indigo-900',
  'from-red-900 via-orange-800 to-red-900',
  'from-emerald-900 via-green-800 to-emerald-900',
  'from-slate-900 via-gray-800 to-slate-900'
]

export function HeroSlider() {
  const router = useRouter()
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSlides()
  }, [])

  async function loadSlides() {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('order_position')

      if (error) throw error

      if (data && data.length > 0) {
        setSlides(data as HeroSlide[])
      } else {
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
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlay, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlay(false)
  }

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length)
    setIsAutoPlay(false)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlay(false)
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
  const bgColor = GRADIENT_COLORS[currentSlide % GRADIENT_COLORS.length]

  return (
    <div className={`relative w-full h-screen bg-gradient-to-br ${bgColor} overflow-hidden group transition-all duration-1000`}>
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-start pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 animate-fade-in">
              {currentSlideData.title}
            </h1>
            {currentSlideData.description && (
              <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed animate-fade-in-delay">
                {currentSlideData.description}
              </p>
            )}
            {currentSlideData.cta_text && currentSlideData.cta_url && (
              <button
                onClick={() => router.push(currentSlideData.cta_url!)}
                className="pointer-events-auto inline-block px-8 py-4 bg-white text-blue-900 rounded-xl font-bold hover:bg-gray-100 transition-all text-lg animate-fade-in-delay-2"
              >
                {currentSlideData.cta_text}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-16 md:h-16 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-16 md:h-16 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
      >
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
