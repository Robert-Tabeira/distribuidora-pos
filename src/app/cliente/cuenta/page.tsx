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
import { Icon } from '@/components/ui/icon'
import { CustomerSavedLists } from '@/components/customer-saved-lists'
import styles from './account.module.css'

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
  const [loggingOut, setLoggingOut] = useState(false)
  const [activeSection, setActiveSection] = useState<'lists' | 'details'>('lists')
  const [featureChecked, setFeatureChecked] = useState(false)
  const [featureEnabled, setFeatureEnabled] = useState(false)

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
        .select('id,name,business_name,phone,email,created_at,approval_status')
        .single()

      if (error) throw error

      const updatedCustomer = { ...data, needs_password_upgrade: customer.needs_password_upgrade }
      saveCustomerSession(updatedCustomer)
      setCustomer(updatedCustomer)
      setMessage('Datos actualizados.')
    } catch (err) {
      console.error('Error al guardar:', err)
      setMessage('No pudimos guardar los cambios.')
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
      setPasswordSuccess('Contraseña actualizada.')
    } catch (err) {
      console.error('Error al cambiar contraseña:', err)
      setPasswordError('No pudimos cambiar la contraseña. Intentá de nuevo.')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      const response = await fetch('/api/customer-shopping-lists', { method: 'DELETE', credentials: 'same-origin' })
      if (!response.ok) throw new Error('Logout failed')
      clearCustomerSession()
      router.push('/catalogo')
    } catch {
      setMessage('No pudimos cerrar la sesión. Revisá la conexión e intentá de nuevo.')
      setActiveSection('details')
    } finally { setLoggingOut(false) }
  }

  if (!featureChecked) {
    return (
      <PublicLayout>
        <div className={`${styles.account} flex items-center justify-center px-4 py-12`}><p className={styles.muted}>Cargando tu cuenta…</p></div>
      </PublicLayout>
    )
  }

  if (!featureEnabled) return <PublicLayout><div className={`${styles.account} flex items-center justify-center px-4 py-12`}><CustomerOrderingUnavailable /></div></PublicLayout>

  if (!customer) {
    return <PublicLayout><div className={`${styles.account} flex items-center justify-center`}><p className={styles.muted}>Cargando tu cuenta…</p></div></PublicLayout>
  }

  return (
    <PublicLayout>
      <div className={styles.account}>
        <div className={styles.container}>
          <header className={styles.intro}><div><p className={styles.eyebrow}>Los Primos · Tu espacio</p><h1 className={styles.title}>Mi cuenta</h1><p className={`${styles.muted} mt-2`}>Tus compras habituales, listas y datos en un solo lugar.</p></div><Link href="/catalogo" className={styles.secondaryButton}><Icon name="grid" className="h-4 w-4" />Explorar catálogo</Link></header>
          {customer.needs_password_upgrade && <p role="status" className="mb-6 rounded-xl border border-[#d6c9aa] bg-[#f7f2e6] p-4 text-sm leading-6 text-[#514738]"><strong>Actualizá tu acceso.</strong> Reemplazá tu código numérico por una contraseña de al menos 12 caracteres con letras y números en Datos → Cambiar contraseña. Usá tu código anterior en el campo de contraseña actual.</p>}

          <div className={styles.layout}>
            <aside className={styles.sidebar}>
              <div className="flex items-center gap-3"><span className={styles.profileIcon}><Icon name="store" className="h-5 w-5" /></span><div className="min-w-0"><p className="text-sm font-bold">{customer.business_name || customer.name}</p><p className={styles.muted}>{customer.name}</p></div></div>
              <nav className={styles.navigation} aria-label="Secciones de Mi cuenta">
                <button onClick={() => setActiveSection('lists')} aria-current={activeSection === 'lists' ? 'page' : undefined} className={styles.navButton}><Icon name="document" className="h-4 w-4 shrink-0" />Mis listas</button>
                <button onClick={() => setActiveSection('details')} aria-current={activeSection === 'details' ? 'page' : undefined} className={styles.navButton}><Icon name="settings" className="h-4 w-4 shrink-0" />Mis datos</button>
              </nav>
              <button onClick={() => void handleLogout()} disabled={loggingOut} className={`${styles.quietButton} mt-4 w-full border-t border-[#e3d7c4]`}><Icon name="logout" className="h-4 w-4" />{loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
            </aside>

            <main className="min-w-0 space-y-4">
            {activeSection === 'lists' ? <CustomerSavedLists customerId={customer.id} /> : <>
            <section className={styles.panel}>
              <p className={styles.eyebrow}>Información de tu cuenta</p><h2 className={`${styles.sectionTitle} mb-5`}>Mis datos</h2>
              <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="account-name" className={styles.label}>Nombre</label>
                <input
                  id="account-name" autoComplete="name" required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={styles.field}
                />
              </div>

              <div>
                <label htmlFor="account-phone" className={styles.label}>Teléfono</label>
                <input
                  id="account-phone"
                  type="text"
                  value={customer.phone}
                  disabled
                  className={styles.field}
                />
                <p className={`${styles.muted} mt-1`}>No se puede cambiar (es tu usuario de acceso)</p>
              </div>

              <div>
                <label htmlFor="account-email" className={styles.label}>
                  Email <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  id="account-email" autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className={styles.field}
                />
                <p className={`${styles.muted} mt-1`}>Este correo permite solicitar la recuperación de tu contraseña.</p>
              </div>

              {message && <p role="status" className={`${styles.notice} ${message.startsWith('No ') ? styles.error : ''}`}>{message}</p>}

              <button
                type="submit"
                disabled={saving}
                className={`${styles.primaryButton} w-full`}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
            </section>

          {/* Cambiar contraseña */}
          <section className={styles.panel}>
            {!showPasswordChange ? (
              <button
                onClick={() => { setPasswordSuccess(''); setShowPasswordChange(true) }}
                className="w-full text-left flex items-center justify-between"
              >
                <span className={styles.listTitle}>Cambiar contraseña</span>
                <span className="text-gray-400">→</span>
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <p className={styles.listTitle}>Cambiar contraseña</p>

                <div>
                  <label htmlFor="account-current-password" className={styles.label}>Contraseña actual {customer.needs_password_upgrade ? '(código anterior)' : ''}</label>
                  <CustomerPasswordInput
                    id="account-current-password" name="current_password" autoComplete="current-password" required
                    maxLength={MAX_PASSWORD_LENGTH} disabled={changingPassword}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={styles.field}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="account-new-password" className={styles.label}>Contraseña nueva</label>
                    <CustomerPasswordInput
                      id="account-new-password" name="new_password" autoComplete="new-password" required
                      minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} disabled={changingPassword}
                      aria-describedby="account-password-help"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={styles.field}
                    />
                    <p id="account-password-help" className={`${styles.muted} mt-1`}>{PASSWORD_HELP}</p>
                  </div>
                  <div>
                    <label htmlFor="account-confirm-password" className={styles.label}>Repetí la contraseña nueva</label>
                    <CustomerPasswordInput
                      id="account-confirm-password" name="password_confirmation" autoComplete="new-password" required
                      minLength={MIN_PASSWORD_LENGTH} maxLength={MAX_PASSWORD_LENGTH} disabled={changingPassword}
                      value={newPasswordConfirm}
                      onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      className={styles.field}
                    />
                  </div>
                </div>

                {passwordError && (
                  <p role="alert" className={`${styles.notice} ${styles.error}`}>{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p role="status" className={styles.notice}>{passwordSuccess}</p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={changingPassword}
                    onClick={() => { setShowPasswordChange(false); setPasswordError(''); setPasswordSuccess(''); setCurrentPassword(''); setNewPassword(''); setNewPasswordConfirm('') }}
                    className={`${styles.secondaryButton} flex-1`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className={`${styles.primaryButton} flex-1`}
                  >
                    {changingPassword ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            )}
          </section>
          </>}

            </main>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
