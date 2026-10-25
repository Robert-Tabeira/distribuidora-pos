'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PublicLayout } from '@/components/public-layout'
import { supabase } from '@/lib/supabase'
import { getCustomerSession, saveCustomerSession, clearCustomerSession, type Customer } from '@/lib/customer-auth'
import { passwordValidationError, PASSWORD_HELP, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@/lib/customer-password'
import { CustomerPasswordInput } from '@/components/customer-password-input'
import { isCustomerOrderingEnabled } from '@/lib/customer-ordering'
import { CustomerOrderingUnavailable } from '@/components/customer-ordering-unavailable'
import { describeBoxContents } from '@/lib/product-packaging'

export default function CustomerAccountPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [shoppingLists, setShoppingLists] = useState<{ id: string; created_at: string; items: { product_id: string; product_name: string; quantity: number; unit?: string; notes?: string; units_per_box?: number | null }[] }[]>([])
  const [listsLoading, setListsLoading] = useState(true)
  const [listsError, setListsError] = useState('')
  const [listsNeedLogin, setListsNeedLogin] = useState(false)
  const [activeSection, setActiveSection] = useState<'lists' | 'details'>('lists')
  const [listsPage, setListsPage] = useState(1)
  const [featureChecked, setFeatureChecked] = useState(false)
  const [featureEnabled, setFeatureEnabled] = useState(false)

  const listsPerPage = 10
  const totalListPages = Math.ceil(shoppingLists.length / listsPerPage)
  const visibleLists = shoppingLists.slice((listsPage - 1) * listsPerPage, listsPage * listsPerPage)

  function getPageNumbers() {
    if (totalListPages <= 7) return Array.from({ length: totalListPages }, (_, i) => i + 1)
    const pages = new Set([1, totalListPages, listsPage, listsPage - 1, listsPage + 1])
    return [...pages].filter(page => page >= 1 && page <= totalListPages).sort((a, b) => a - b)
  }

  useEffect(() => {
    isCustomerOrderingEnabled().then(enabled => {
      setFeatureEnabled(enabled)
      setFeatureChecked(true)
    })
    const session = getCustomerSession()
    if (!session) {
      router.push('/cliente/login')
      return
    }
    setCustomer(session)
    setName(session.name)
    setEmail(session.email || '')
    if (session.needs_password_upgrade) {
      setActiveSection('details')
      setShowPasswordChange(true)
    }
    void loadShoppingLists(session.id)
  }, [router])

  async function loadShoppingLists(customerId: string) {
    setListsLoading(true)
    setListsError('')
    setListsNeedLogin(false)
    try {
      const response = await fetch('/api/customer-shopping-lists', { cache: 'no-store', credentials: 'same-origin', headers: { 'X-Customer-Id': customerId } })
      const result = await response.json()
      if (!response.ok) {
        setShoppingLists([])
        setListsNeedLogin(response.status === 401)
        setListsError(result.error || 'No pudimos cargar tus listas. Intentá de nuevo.')
        return
      }
      setShoppingLists(Array.isArray(result.lists) ? result.lists : [])
      setListsPage(1)
    } catch {
      setListsError('No pudimos cargar tus listas. Revisá la conexión e intentá de nuevo.')
    } finally { setListsLoading(false) }
  }

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
        .select('id,name,business_name,phone,email,created_at,approval_status')
        .single()

      if (error) throw error

      const updatedCustomer = { ...data, needs_password_upgrade: customer.needs_password_upgrade }
      saveCustomerSession(updatedCustomer)
      setCustomer(updatedCustomer)
      setMessage('✅ Datos actualizados')
    } catch (err) {
      console.error('Error al guardar:', err)
      setMessage('❌ No pudimos guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (!customer) return

    if (!currentPassword) {
      setPasswordError('Ingresá tu contraseña actual o tu código anterior')
      return
    }
    const validationError = passwordValidationError(newPassword)
    if (validationError) {
      setPasswordError(validationError)
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError('Las contraseñas nuevas no coinciden')
      return
    }
    if (newPassword === currentPassword) {
      setPasswordError('Elegí una contraseña diferente de la actual')
      return
    }

    setChangingPassword(true)
    try {
      const response = await fetch('/api/customer-access', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', customer_id: customer.id, current_password: currentPassword, password: newPassword }),
      })
      const result = await response.json()
      if (!response.ok || !result.customer) {
        setPasswordError(result.error || 'No pudimos cambiar la contraseña')
        return
      }
      const updatedCustomer: Customer = result.customer
      saveCustomerSession(updatedCustomer)
      setCustomer(updatedCustomer)
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
      setPasswordSuccess('✅ Contraseña actualizada')
    } catch (err) {
      console.error('Error al cambiar contraseña:', err)
      setPasswordError('No pudimos cambiar la contraseña. Intentá de nuevo.')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch('/api/customer-shopping-lists', { method: 'DELETE', credentials: 'same-origin' })
      if (!response.ok) throw new Error('Logout failed')
      clearCustomerSession()
      router.push('/catalogo')
    } catch {
      setMessage('No pudimos cerrar la sesión. Revisá la conexión e intentá de nuevo.')
      setActiveSection('details')
    }
  }

  function repeatShoppingList(list: typeof shoppingLists[number]) {
    localStorage.setItem('los_primos_cart', JSON.stringify(list.items.map((item, index) => ({ itemId: `${item.product_id}-${item.unit || 'unidad'}-${index}`, productId: item.product_id, quantity: item.quantity, unit: item.unit || 'unidad', notes: item.notes || '' }))))
    router.push('/catalogo')
  }

  if (!featureChecked) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 text-gray-500">Cargando...</div>
      </PublicLayout>
    )
  }

  if (!featureEnabled) return <PublicLayout><div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12"><CustomerOrderingUnavailable /></div></PublicLayout>

  if (!customer) {
    return <PublicLayout><div className="min-h-screen flex items-center justify-center text-gray-500">Cargando...</div></PublicLayout>
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gray-50 px-4 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Mi Cuenta</h1>
          <p className="text-sm text-gray-600 mb-6">Tus datos y listas de compras</p>
          {customer.needs_password_upgrade && <p role="status" className="mb-6 rounded-xl border border-[#d6c9aa] bg-[#f7f2e6] p-4 text-sm leading-6 text-[#514738]"><strong>Actualizá tu acceso.</strong> Reemplazá tu código numérico por una contraseña de al menos 12 caracteres con letras y números en Datos → Cambiar contraseña. Usá tu código anterior en el campo de contraseña actual.</p>}

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
              {listsLoading ? <p role="status" className="text-sm text-gray-500">Cargando tus listas…</p> : listsError ? <div role="alert" className="rounded-xl border border-[#d6c9aa] bg-[#f7f2e6] p-4 text-sm text-[#514738]"><p>{listsError}</p>{listsNeedLogin ? <Link href="/cliente/login" className="mt-3 inline-block font-bold underline">Volver a iniciar sesión</Link> : <button onClick={() => void loadShoppingLists(customer.id)} className="mt-3 font-bold underline">Reintentar</button>}</div> : shoppingLists.length === 0 ? <p className="text-sm text-gray-500">Todavía no guardaste listas desde el catálogo.</p> : <>
                <div className="space-y-3">{visibleLists.map(list => <div key={list.id} className="border border-gray-200 rounded-xl p-3 sm:p-4">
                  <div className="flex justify-between items-center gap-3"><p className="font-semibold">{new Date(list.created_at).toLocaleDateString('es-UY')}</p><button onClick={() => repeatShoppingList(list)} className="px-3 py-2 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800">Repetir lista</button></div>
                  <ul className="mt-2 text-sm text-gray-600">{list.items.map((item, index) => {
                    const contents = describeBoxContents({ unit: item.unit || 'unidad', units_per_box: item.units_per_box }, item.quantity)
                    return <li key={`${item.product_id}-${index}`}>{item.quantity} × {item.product_name} <span className="text-gray-400">({item.unit || 'unidad'})</span>{contents && <p className="ml-3 text-xs text-[#575b36]">{contents}</p>}{item.notes && <p className="ml-3 text-xs text-gray-500">Nota: {item.notes}</p>}</li>
                  })}</ul>
                </div>)}</div>
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
                <p className="text-xs text-gray-500 mt-1">Este correo permite solicitar la recuperación de tu contraseña.</p>
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

          {/* Cambiar contraseña */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
            {!showPasswordChange ? (
              <button
                onClick={() => { setPasswordSuccess(''); setShowPasswordChange(true) }}
                className="w-full text-left flex items-center justify-between"
              >
                <span className="font-semibold text-gray-900">Cambiar contraseña</span>
                <span className="text-gray-400">→</span>
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <p className="font-semibold text-gray-900">Cambiar contraseña</p>

                <div>
                  <label htmlFor="account-current-password" className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña actual {customer.needs_password_upgrade ? '(código anterior)' : ''}</label>
                  <CustomerPasswordInput
                    id="account-current-password" name="current_password" autoComplete="current-password" required
                    maxLength={MAX_PASSWORD_LENGTH} disabled={changingPassword}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="account-new-password" className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña nueva</label>
                    <CustomerPasswordInput
                      id="account-new-password" name="new_password" autoComplete="new-password" required
                      minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} disabled={changingPassword}
                      aria-describedby="account-password-help"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                    <p id="account-password-help" className="mt-1 text-xs text-gray-500">{PASSWORD_HELP}</p>
                  </div>
                  <div>
                    <label htmlFor="account-confirm-password" className="block text-sm font-semibold text-gray-700 mb-1.5">Repetí la contraseña nueva</label>
                    <CustomerPasswordInput
                      id="account-confirm-password" name="password_confirmation" autoComplete="new-password" required
                      minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} disabled={changingPassword}
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>
                </div>

                {passwordError && (
                  <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p role="status" className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{passwordSuccess}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={changingPassword}
                    onClick={() => { setShowPasswordChange(false); setPasswordError(''); setPasswordSuccess(''); setCurrentPassword(''); setNewPassword(''); setNewPasswordConfirm('') }}
                    className="flex-1 py-2.5 bg-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex-1 py-2.5 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-60"
                  >
                    {changingPassword ? 'Guardando...' : 'Confirmar'}
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
