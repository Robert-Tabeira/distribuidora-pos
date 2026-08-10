'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface WebsiteSettings {
  phone_number: string | null
  email: string | null
  address: string | null
  business_hours: string | null
}

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [settings, setSettings] = useState<WebsiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('phone_number, email, address, business_hours')
        .single()

      if (!error && data) {
        setSettings(data as WebsiteSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex flex-col">
            <h1 className="text-2xl font-black text-gray-900">Los Primos</h1>
            <p className="text-xs text-gray-600 font-semibold">Distribuidora Oficial Sarubbi</p>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden md:flex gap-8">
            <Link
              href="/"
              className={`font-semibold transition-all ${
                isActive('/') || isActive('/landing')
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Inicio
            </Link>
            <Link
              href="/catalogo"
              className={`font-semibold transition-all ${
                isActive('/catalogo')
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              Catálogo
            </Link>
          </nav>

          {/* Business Info Button */}
          <div className="relative">
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-semibold transition-all md:w-auto text-xs md:text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden md:inline">Info</span>
            </button>

            {/* Dropdown Info */}
            {showInfo && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-6 z-50">
                <h3 className="font-bold text-gray-900 mb-4">Datos del Negocio</h3>

                <div className="space-y-4">
                  {settings?.phone_number && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">Teléfono</p>
                        <a href={`https://wa.me/${settings.phone_number.replace(/\D/g, '')}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-all">
                          {settings.phone_number}
                        </a>
                      </div>
                    </div>
                  )}

                  {settings?.business_hours && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">Horarios</p>
                        <p className="font-semibold text-gray-900">{settings.business_hours}</p>
                      </div>
                    </div>
                  )}

                  {settings?.address && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">Dirección</p>
                        <p className="font-semibold text-gray-900">{settings.address}</p>
                      </div>
                    </div>
                  )}

                  {settings?.email && (
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <a href={`mailto:${settings.email}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-all">
                          {settings.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {!settings?.phone_number && !settings?.address && !settings?.business_hours && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No hay datos de negocio configurados
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
