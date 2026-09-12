'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PublicLayout } from '@/components/public-layout'
import { supabase } from '@/lib/supabase'
import { hashPin, normalizePhone, saveCustomerSession } from '@/lib/customer-auth'
import Link from 'next/link'

export default function CustomerLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const cleanPhone = normalizePhone(phone)
    if (!cleanPhone || !pin) {
      setError('Completá tu teléfono y código')
      return
    }

    setLoading(true)
    try {
      const pinHash = await hashPin(pin)

      const { data, error: queryError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', cleanPhone)
        .eq('pin_hash', pinHash)
        .single()

      if (queryError || !data) {
        setError('Teléfono o código incorrecto')
        return
      }

      await supabase
        .from('customers')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.id)

      saveCustomerSession(data)
      router.push('/catalogo')
    } catch (err) {
      console.error('Error al iniciar sesión:', err)
      setError('No pudimos iniciar sesión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Iniciar sesión</h1>
          <p className="text-sm text-gray-600 mb-6">Para armar y mandar tu pedido</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="099 123 456"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 tracking-widest"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all disabled:opacity-60"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            ¿No tenés cuenta?{' '}
            <Link href="/cliente/registro" className="text-blue-900 font-semibold hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}
