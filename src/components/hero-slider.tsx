'use client'

import { useState, useEffect } from 'react'

export interface HeroImage {
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
    <div className="w-full bg-gray-900 py-8 md:py-12 px-4">
      <div className="max-w-5xl mx-auto relative bg-gray-900 overflow-hidden rounded-3xl group h-96 md:h-[500px]">
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
          <div className="px-6 md:px-12 w-full">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 animate-fade-in">
                {currentImage.title}
              </h1>
              <p className="text-base md:text-lg text-white/90 mb-6 line-clamp-2 animate-fade-in-delay">
                {currentImage.description}
              </p>
              <a
                href={currentImage.cta_url}
                className="pointer-events-auto inline-block px-6 md:px-8 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all animate-fade-in-delay-2"
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
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all rounded-full ${
                index === currentSlide
                  ? 'w-6 md:w-8 h-2.5 md:h-3 bg-white'
                  : 'w-2.5 md:w-3 h-2.5 md:h-3 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
