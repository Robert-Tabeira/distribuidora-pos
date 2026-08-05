'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface WebsiteSettings {
  phone: string
}

export function Header() {
  const router = useRouter()
  const [phone, setPhone] = useState('+598 99 123 4567')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const { data } = await supabase
        .from('website_settings')
        .select('phone')
        .single()

      if (data?.phone) {
        setPhone(data.phone)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/landing')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="text-3xl font-black text-blue-900">Los Primos</div>
          </button>

          {/* Teléfono */}
          <a
            href={`https://wa.me/${phone.replace(/\s/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.289-4.909 6.233-4.909 10.33 0 1.455.267 2.858.77 4.187L2.657 22.5l4.383-1.441c1.294.756 2.783 1.166 4.38 1.166 5.64 0 10.233-4.592 10.233-10.233 0-2.65-.997-5.151-2.791-7.035A10.234 10.234 0 0011.052 6.979z" />
            </svg>
            <div>
              <div className="text-xs text-gray-500">WhatsApp</div>
              <div className="font-bold text-gray-900">{!loading ? phone : 'Cargando...'}</div>
            </div>
          </a>

          {/* Mobile phone button */}
          <a
            href={`https://wa.me/${phone.replace(/\s/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.289-4.909 6.233-4.909 10.33 0 1.455.267 2.858.77 4.187L2.657 22.5l4.383-1.441c1.294.756 2.783 1.166 4.38 1.166 5.64 0 10.233-4.592 10.233-10.233 0-2.65-.997-5.151-2.791-7.035A10.234 10.234 0 0011.052 6.979z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  )
}
