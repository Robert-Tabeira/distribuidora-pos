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
  const [shoppingLists, setShoppingLists] = useState<{ id: string; created_at: string; items: { product_id: string; product_name: string; quantity: number; unit?: string; notes?: string }[] }[]>([])
  const [activeSection, setActiveSection] = useState<'lists' | 'details'>('lists')
  const [listsPage, setListsPage] = useState(1)

  const listsPerPage = 10
  const totalListPages = Math.ceil(shoppingLists.length / listsPerPage)
  const visibleLists = shoppingLists.slice((listsPage - 1) * listsPerPage, listsPage * listsPerPage)

  function getPageNumbers() {
    if (totalListPages <= 7) return Array.from({ length: totalListPages }, (_, i) => i + 1)
    const pages = new Set([1, totalListPages, listsPage, listsPage - 1, listsPage + 1])
    return [...pages].filter(page => page >= 1 && page <= totalListPages).sort((a, b) => a - b)
  }

  useEffect(() => {
    const session = getCustomerSession()
    if (!session) {
      router.push('/cliente/login')
      return
    }
    setCustomer(session)
    setName(session.name)
    setEmail(session.email || '')
    supabase.from('customer_shopping_lists').select('id, created_at, items').eq('customer_id', session.id).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setShoppingLists(data as typeof shoppingLists)
    })
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

  function repeatShoppingList(list: typeof shoppingLists[number]) {
    localStorage.setItem('los_primos_cart', JSON.stringify(list.items.map((item, index) => ({ itemId: `${item.product_id}-${item.unit || 'unidad'}-${index}`, productId: item.product_id, quantity: item.quantity, unit: item.unit || 'unidad', notes: item.notes || '' }))))
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
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Mi Cuenta</h1>
          <p className="text-sm text-gray-600 mb-6">Tus datos y listas de compras</p>

          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-6 items-start">
            <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 md:sticky md:top-24">
              <nav className="flex md:flex-col gap-2" aria-label="Secciones de Mi Cuenta">
                <button onClick={() => setActiveSection('lists')} className={`flex-1 md:flex-none text-left px-4 py-3 rounded-xl font-semibold transition-colors ${activeSection === 'lists' ? 'bg-blue-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Listas de compras</button>
                <button onClick={() => setActiveSection('details')} className={`flex-1 md:flex-none text-left px-4 py-3 rounded-xl font-semibold transition-colors ${activeSection === 'details' ? 'bg-blue-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>Datos</button>
              </nav>
            </aside>

            <main className="min-w-0 space-y-4">
            {activeSection === 'lists' ? <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-gray-900 text-lg">Mis listas de compras</h2>
              <p className="text-sm text-gray-500 mt-1 mb-4">Guardá una lista para armarla de nuevo cuando quieras.</p>
              {shoppingLists.length === 0 ? <p className="text-sm text-gray-500">Todavía no guardaste listas desde el catálogo.</p> : <>
                <div className="space-y-3">{visibleLists.map(list => <div key={list.id} className="border border-gray-200 rounded-xl p-3 sm:p-4"><div className="flex justify-between items-center gap-3"><p className="font-semibold">{new Date(list.created_at).toLocaleDateString('es-UY')}</p><button onClick={() => repeatShoppingList(list)} className="px-3 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800">Repetir lista</button></div><ul className="mt-2 text-sm text-gray-600">{list.items.map((item, index) => <li key={`${item.product_id}-${index}`}>{item.quantity} × {item.product_name} <span className="text-gray-400">({item.unit || 'unidad'})</span>{item.notes && <p className="ml-3 text-xs text-gray-500">Nota: {item.notes}</p>}</li>)}</ul></div>)}</div>
                {totalListPages > 1 && <nav className="flex flex-wrap justify-center items-center gap-1.5 mt-6" aria-label="Páginas de listas">
                  <button disabled={listsPage === 1} onClick={() => setListsPage(page => Math.max(1, page - 1))} className="px-3 py-2 rounded-lg border text-sm disabled:opacity-40">Anterior</button>
                  {getPageNumbers().map((page, index, pages) => <span key={page} className="flex items-center gap-1.5">{index > 0 && page - pages[index - 1] > 1 && <span className="px-1 text-gray-400">…</span>}<button aria-current={page === listsPage ? 'page' : undefined} onClick={() => setListsPage(page)} className={`min-w-9 px-3 py-2 rounded-lg border text-sm font-semibold ${page === listsPage ? 'bg-blue-900 border-blue-900 text-white' : 'hover:bg-gray-50'}`}>{page}</button></span>)}
                  <button disabled={listsPage === totalListPages} onClick={() => setListsPage(page => Math.min(totalListPages, page + 1))} className="px-3 py-2 rounded-lg border text-sm disabled:opacity-40">Siguiente</button>
                </nav>}
              </>}
            </section> : <>
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Datos personales</h2>
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
                <p className="text-xs text-gray-500 mt-1">Si olvidás tu código de acceso, te enviaremos uno nuevo a este correo.</p>
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
            </section>

          {/* Cambiar código */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
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
          </section>
          </>}

          <button
            onClick={handleLogout}
            className="w-full py-3 text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-all"
          >
            Cerrar sesión
          </button>
            </main>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
