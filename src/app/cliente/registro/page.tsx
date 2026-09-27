'use client'

import { useState } from 'react'
import { PublicLayout } from '@/components/public-layout'
import { supabase } from '@/lib/supabase'
import { hashPin, normalizePhone } from '@/lib/customer-auth'
import Link from 'next/link'

export default function CustomerRegisterPage() {
  const [name, setName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const cleanPhone = normalizePhone(phone)

    if (!name.trim()) return setError('Ingresá tu nombre')
    if (!businessName.trim()) return setError('Ingresá el nombre del comercio')
    if (cleanPhone.length < 8) return setError('Ingresá un teléfono válido')
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      return setError('El código debe tener entre 4 y 6 números')
    }
    if (pin !== pinConfirm) return setError('Los códigos no coinciden')

    setLoading(true)
    try {
      const pinHash = await hashPin(pin)

      const { data, error: insertError } = await supabase
        .from('customers')
        .insert([{
          name: name.trim(),
          business_name: businessName.trim(),
          phone: cleanPhone,
          email: email.trim() || null,
          pin_hash: pinHash,
          approval_status: 'pending'
        }])
        .select()
        .single()

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Ya existe una cuenta con ese teléfono. Iniciá sesión en vez de registrarte.')
        } else {
          throw insertError
        }
        return
      }

      setSubmitted(true)
    } catch (err) {
      console.error('Error al registrar:', err)
      setError('No pudimos crear tu cuenta. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {submitted ? <>
            <div className="text-4xl mb-3">🕒</div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Solicitud recibida</h1>
            <p className="text-sm text-gray-700 leading-relaxed">Revisaremos los datos del comercio y el teléfono indicado. La respuesta puede demorar hasta 24 horas. El acceso para realizar pedidos queda sujeto a la evaluación y aprobación de Distribuidora Los Primos; el envío de la solicitud no garantiza su aprobación.</p>
            <Link href="/catalogo" className="block text-center mt-6 w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800">Volver al catálogo</Link>
          </> : <>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Creá tu cuenta</h1>
          <p className="text-sm text-gray-600 mb-6">Solicitá acceso para realizar pedidos como comercio.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre del comercio</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Almacén, kiosco, restaurante..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="099 123 456"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <p className="text-xs text-gray-500 mt-1">Usá el teléfono desde el que habitualmente enviás los pedidos.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <p className="text-xs text-gray-500 mt-1">Para avisos y promociones, si querés recibirlas</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código (4-6 números)</label>
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Repetilo</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 tracking-widest"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all disabled:opacity-60"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link href="/cliente/login" className="text-blue-900 font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
          </>}
        </div>
      </div>
    </PublicLayout>
  )
}
