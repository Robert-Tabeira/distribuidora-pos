'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PublicLayout } from '@/components/public-layout'
import { normalizePhone, saveCustomerSession } from '@/lib/customer-auth'
import { MAX_PASSWORD_LENGTH } from '@/lib/customer-password'
import { CustomerPasswordInput } from '@/components/customer-password-input'
import Link from 'next/link'
import { isCustomerOrderingEnabled } from '@/lib/customer-ordering'
import { CustomerOrderingUnavailable } from '@/components/customer-ordering-unavailable'

export default function CustomerLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [featureChecked, setFeatureChecked] = useState(false)
  const [featureEnabled, setFeatureEnabled] = useState(false)

  useEffect(() => {
    isCustomerOrderingEnabled().then(enabled => {
      setFeatureEnabled(enabled)
      setFeatureChecked(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const cleanPhone = normalizePhone(phone)
    if (!cleanPhone || !password) {
      setError('Completá tu teléfono y contraseña')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/customer-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', phone: cleanPhone, password }),
      })
      const result = await response.json()
      if (!response.ok || !result.customer) {
        setError(result.error || 'No pudimos iniciar sesión')
        return
      }
      saveCustomerSession(result.customer)
      setPassword('')
      router.push(result.customer.needs_password_upgrade ? '/cliente/cuenta' : '/catalogo')
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
        {!featureChecked ? <p className="text-gray-500">Cargando...</p> : !featureEnabled ? <CustomerOrderingUnavailable /> : <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Iniciar sesión</h1>
          <p className="text-sm text-gray-600 mb-6">Acceso para negocios con cuenta aprobada por el local.</p>

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
              <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
              <CustomerPasswordInput
                id="login-password" name="password" autoComplete="current-password" required
                maxLength={MAX_PASSWORD_LENGTH} disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <Link href="/cliente/recuperar" className="text-xs text-blue-900 font-semibold hover:underline mt-1.5 inline-block">
                ¿Olvidaste tu contraseña?
              </Link>
              <p className="mt-2 text-xs leading-5 text-gray-500">Si ya tenías una cuenta con código numérico, ingresá ese código para cambiarlo por una contraseña desde Mi cuenta.</p>
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
              Solicitá el registro de tu negocio
            </Link>
          </p>
          <p className="mt-2 text-center text-xs leading-5 text-gray-600">El registro es únicamente para negocios y está sujeto a la revisión y confirmación del local.</p>
        </div>}
      </div>
    </PublicLayout>
  )
}
