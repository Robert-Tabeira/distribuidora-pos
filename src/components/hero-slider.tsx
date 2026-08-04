'use client'

import { useState, useEffect } from 'react'

interface HeroImage {
  id: number
  url: string
  title: string
  description: string
  cta_text: string
  cta_url: string
}

export function HeroSlider({ images }: { images: HeroImage[] }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  useEffect(() => {
    if (!isAutoPlay || images.length === 0) return

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlay, images.length])

  if (!images || images.length === 0) return null

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlay(false)
  }

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % images.length)
    setIsAutoPlay(false)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + images.length) % images.length)
    setIsAutoPlay(false)
  }

  const currentImage = images[currentSlide]

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden group">
      {/* Slides */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-full object-cover"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-start pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 animate-fade-in">
              {currentImage.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed animate-fade-in-delay">
              {currentImage.description}
            </p>
            <a
              href={currentImage.cta_url}
              className="pointer-events-auto inline-block px-8 py-4 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all text-lg animate-fade-in-delay-2"
            >
              {currentImage.cta_text}
            </a>
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
        {images.map((_, index) => (
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
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Auto-play
        </div>
      )}
    </div>
  )
}
