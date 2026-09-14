'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PublicLayout } from '@/components/public-layout'
import { supabase } from '@/lib/supabase'
import { getCustomerSession, saveCustomerSession, clearCustomerSession, hashPin, type Customer } from '@/lib/customer-auth'

export default function CustomerAccountPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [showPinChange, setShowPinChange] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newPinConfirm, setNewPinConfirm] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState('')
  const [changingPin, setChangingPin] = useState(false)

  useEffect(() => {
    const session = getCustomerSession()
    if (!session) {
      router.push('/cliente/login')
      return
    }
    setCustomer(session)
    setName(session.name)
    setEmail(session.email || '')
  }, [router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!customer) return

    setSaving(true)
    setMessage('')
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({ name: name.trim(), email: email.trim() || null })
        .eq('id', customer.id)
        .select()
        .single()

      if (error) throw error

      saveCustomerSession(data)
      setCustomer(data)
      setMessage('✅ Datos actualizados')
    } catch (err) {
      console.error('Error al guardar:', err)
      setMessage('❌ No pudimos guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePin(e: React.FormEvent) {
    e.preventDefault()
    setPinError('')
    setPinSuccess('')
    if (!customer) return

    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      setPinError('El código nuevo debe tener entre 4 y 6 números')
      return
    }
    if (newPin !== newPinConfirm) {
      setPinError('Los códigos nuevos no coinciden')
      return
    }

    setChangingPin(true)
    try {
      const currentHash = await hashPin(currentPin)
      const { data: check } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customer.id)
        .eq('pin_hash', currentHash)
        .single()

      if (!check) {
        setPinError('Tu código actual no es correcto')
        return
      }

      const newHash = await hashPin(newPin)
      const { error } = await supabase
        .from('customers')
        .update({ pin_hash: newHash })
        .eq('id', customer.id)

      if (error) throw error

      setCurrentPin('')
      setNewPin('')
      setNewPinConfirm('')
      setPinSuccess('✅ Código actualizado')
      setTimeout(() => setShowPinChange(false), 1500)
    } catch (err) {
      console.error('Error al cambiar código:', err)
      setPinError('No pudimos cambiar el código')
    } finally {
      setChangingPin(false)
    }
  }

  function handleLogout() {
    clearCustomerSession()
    router.push('/catalogo')
  }

  if (!customer) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando...</div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="max-w-md mx-auto space-y-4">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Mi Cuenta</h1>
          <p className="text-sm text-gray-600 mb-4">Tus datos y acceso</p>

          {/* Datos personales */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teléfono</label>
                <input
                  type="text"
                  value={customer.phone}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">No se puede cambiar (es tu usuario de acceso)</p>
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
                <p className="text-xs text-gray-500 mt-1">Lo usamos para avisos y para recuperar tu código si lo olvidás</p>
              </div>

              {message && <p className="text-sm">{message}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>

          {/* Cambiar código */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            {!showPinChange ? (
              <button
                onClick={() => setShowPinChange(true)}
                className="w-full text-left flex items-center justify-between"
              >
                <span className="font-semibold text-gray-900">Cambiar código de acceso</span>
                <span className="text-gray-400">→</span>
              </button>
            ) : (
              <form onSubmit={handleChangePin} className="space-y-4">
                <p className="font-semibold text-gray-900">Cambiar código de acceso</p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código actual</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 tracking-widest"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código nuevo</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Repetilo</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPinConfirm}
                      onChange={(e) => setNewPinConfirm(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 tracking-widest"
                    />
                  </div>
                </div>

                {pinError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pinError}</p>
                )}
                {pinSuccess && (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{pinSuccess}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowPinChange(false); setPinError(''); setCurrentPin(''); setNewPin(''); setNewPinConfirm('') }}
                    className="flex-1 py-2.5 bg-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={changingPin}
                    className="flex-1 py-2.5 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-60"
                  >
                    {changingPin ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-all"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </PublicLayout>
  )
}
