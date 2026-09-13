'use client'

import { useState } from 'react'
import { PublicLayout } from '@/components/public-layout'
import { normalizePhone } from '@/lib/customer-auth'
import Link from 'next/link'

type Result = 'email' | 'whatsapp' | 'not_found' | null

export default function RecoverPinPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResult(null)

    const cleanPhone = normalizePhone(phone)
    if (cleanPhone.length < 8) {
      setError('Ingresá un teléfono válido')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/recover-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      })
      const data = await res.json()

      if (!res.ok) {
        setError('No pudimos procesar el pedido. Intentá de nuevo.')
        return
      }

      setResult(data.method)
    } catch (err) {
      console.error('Error al recuperar código:', err)
      setError('No pudimos procesar el pedido. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const whatsappMessage = encodeURIComponent(
    `Hola, olvidé mi código de acceso. Mi teléfono registrado es ${normalizePhone(phone)}. ¿Me pueden ayudar a restablecerlo?`
  )

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Recuperar código</h1>
          <p className="text-sm text-gray-600 mb-6">Ingresá tu teléfono registrado</p>

          {!result && (
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

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all disabled:opacity-60"
              >
                {loading ? 'Buscando...' : 'Continuar'}
              </button>
            </form>
          )}

          {result === 'email' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <p className="font-semibold text-gray-900 mb-2">¡Listo! Revisá tu email</p>
              <p className="text-sm text-gray-600">
                Te mandamos un código nuevo a tu casilla registrada. Puede tardar unos minutos, y revisá spam por las dudas.
              </p>
            </div>
          )}

          {result === 'whatsapp' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">💬</div>
              <p className="font-semibold text-gray-900 mb-2">No tenés email cargado</p>
              <p className="text-sm text-gray-600 mb-5">
                Escribinos por WhatsApp con el mensaje ya armado y te ayudamos a restablecerlo.
              </p>
              <a
                href={`https://wa.me/?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
                Escribir por WhatsApp
              </a>
            </div>
          )}

          {result === 'not_found' && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🤔</div>
              <p className="font-semibold text-gray-900 mb-2">No encontramos ese teléfono</p>
              <p className="text-sm text-gray-600 mb-5">Revisá que esté bien escrito, o registrate si todavía no tenés cuenta.</p>
              <Link href="/cliente/registro" className="text-blue-900 font-semibold hover:underline text-sm">
                Crear cuenta
              </Link>
            </div>
          )}

          {result && (
            <button
              onClick={() => { setResult(null); setPhone('') }}
              className="w-full mt-6 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              ← Probar con otro teléfono
            </button>
          )}

          <p className="text-sm text-gray-600 text-center mt-6">
            <Link href="/cliente/login" className="text-blue-900 font-semibold hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}
