'use client'

import { useState, useEffect } from 'react'
import { PublicLayout } from '@/components/public-layout'
import { supabase } from '@/lib/supabase'
import { hashPin, normalizePhone } from '@/lib/customer-auth'
import Link from 'next/link'
import { isCustomerOrderingEnabled } from '@/lib/customer-ordering'
import { CustomerOrderingUnavailable } from '@/components/customer-ordering-unavailable'

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
      setError('No pudimos enviar tu solicitud de registro. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        {!featureChecked ? <p className="text-gray-500">Cargando...</p> : !featureEnabled ? <CustomerOrderingUnavailable /> : <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {submitted ? <>
            <div className="text-4xl mb-3">🕒</div>
            <h1 className="text-2xl font-black text-gray-900 mb-3">Solicitud recibida</h1>
            <p className="mb-3 text-sm font-bold text-[#575b36]">Registro únicamente para negocios.</p>
            <p className="text-sm text-gray-700 leading-relaxed">Tu cuenta está pendiente de revisión y confirmación por parte del local. Revisaremos los datos del comercio y el teléfono indicado; la respuesta puede demorar hasta 24 horas. La cuenta se habilitará únicamente si Distribuidora Los Primos aprueba la solicitud. Enviar el formulario no implica su aprobación automática.</p>
            <Link href="/catalogo" className="block text-center mt-6 w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800">Volver al catálogo</Link>
          </> : <>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Solicitá tu cuenta de negocio</h1>
          <p className="text-sm text-gray-600 mb-4">Completá los datos de tu comercio para solicitar el acceso.</p>

          <div className="mb-6 rounded-xl border border-[#d6c9aa] bg-[#f7f2e6] p-4 text-[#514738]">
            <h2 className="text-sm font-extrabold">ÚNICAMENTE PARA NEGOCIOS</h2>
            <p className="mt-2 text-sm leading-6">El registro está sujeto a la revisión y confirmación del local. La cuenta se habilita solo después de que Distribuidora Los Primos apruebe la solicitud.</p>
            <p className="mt-2 text-sm leading-6">Si comprás para tu hogar, podés <Link href="/catalogo" className="font-semibold underline">hacer un pedido sin registro para retirar en mostrador</Link>.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="rounded-xl border border-[#e3d7c4] bg-[#f8f3e9] p-3 text-xs leading-6 text-[#706556]">Usamos tus datos para gestionar el acceso, guardar tus listas y atender consultas y pedidos. El correo es opcional y permite recuperar el acceso. Más información en la <Link href="/privacidad" className="font-semibold underline">política de privacidad</Link> y los <Link href="/terminos" className="font-semibold underline">términos de uso</Link>.</p>
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
              <p className="text-xs text-gray-500 mt-1">Si olvidás tu código de acceso, te enviaremos uno nuevo a este correo.</p>
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
              {loading ? 'Enviando solicitud...' : 'Solicitar registro de negocio'}
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link href="/cliente/login" className="text-blue-900 font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
          </>}
        </div>}
      </div>
    </PublicLayout>
  )
}
