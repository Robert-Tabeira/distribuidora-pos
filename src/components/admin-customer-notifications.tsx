'use client'

import { useEffect, useRef, useState } from 'react'
import { staffFetch, useStaffRouter } from '@/lib/staff-navigation'

type PendingRegistration = { id: string; name: string; business_name: string | null; created_at: string }
type PendingNotifications = { count: number; requests: PendingRegistration[] }

function registrationDate(value: string) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toLocaleString('es-UY', {
    timeZone: 'America/Montevideo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }) : ''
}

export function AdminCustomerNotifications() {
  const router = useStaffRouter()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<PendingNotifications | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const refreshRef = useRef<() => void>(() => {})

  useEffect(() => {
    let disposed = false
    let inFlight = false
    let accessUnavailable = false
    let controller: AbortController | null = null

    async function refresh(force = false) {
      if (disposed || inFlight || document.visibilityState === 'hidden' || (accessUnavailable && !force)) return
      inFlight = true
      controller = new AbortController()
      const currentController = controller
      const timeout = window.setTimeout(() => currentController.abort(), 12000)
      setLoading(true)
      try {
        const response = await staffFetch('/api/staff-customer-notifications', {
          credentials: 'same-origin', cache: 'no-store', signal: currentController.signal,
        })
        const body = await response.json()
        if (disposed) return
        if (!response.ok) {
          accessUnavailable = response.status === 401 || response.status === 403
          setNeedsLogin(accessUnavailable)
          throw new Error(body.error || 'No pudimos consultar las solicitudes.')
        }
        if (!Number.isSafeInteger(body.count) || body.count < 0 || !Array.isArray(body.requests)) throw new Error('No pudimos consultar las solicitudes.')
        accessUnavailable = false
        setNeedsLogin(false)
        setData({ count: body.count, requests: body.requests })
        setError('')
      } catch (reason) {
        if (!disposed) setError(reason instanceof Error && reason.name !== 'AbortError'
          ? reason.message : 'No pudimos actualizar las solicitudes. Revisá tu conexión e intentá nuevamente.')
      } finally {
        window.clearTimeout(timeout)
        inFlight = false
        controller = null
        if (!disposed) setLoading(false)
      }
    }

    const refreshVisible = () => { void refresh() }
    refreshRef.current = () => { void refresh(true) }
    refreshVisible()
    const interval = window.setInterval(refreshVisible, 30000)
    window.addEventListener('focus', refreshVisible)
    window.addEventListener('online', refreshVisible)
    document.addEventListener('visibilitychange', refreshVisible)
    return () => {
      disposed = true
      controller?.abort()
      refreshRef.current = () => {}
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshVisible)
      window.removeEventListener('online', refreshVisible)
      document.removeEventListener('visibilitychange', refreshVisible)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false)
    }
    const keyboard = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setOpen(false)
      buttonRef.current?.focus({ preventScroll: true })
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('focusin', closeOutside)
    document.addEventListener('keydown', keyboard)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('focusin', closeOutside)
      document.removeEventListener('keydown', keyboard)
    }
  }, [open])

  const count = data?.count ?? null
  const label = error ? 'Notificaciones: no se pudo actualizar el estado'
    : count === null ? 'Notificaciones: consultando solicitudes'
    : count === 0 ? 'Notificaciones: no hay solicitudes pendientes'
    : `Notificaciones: ${count} ${count === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}`
  const reviewRequests = () => { setOpen(false); router.push('/admin/clientes') }

  return <div ref={containerRef} className="relative shrink-0">
    <button ref={buttonRef} type="button" aria-label={label} title={label} aria-expanded={open} aria-controls="admin-registration-notifications"
      onClick={() => { setOpen(current => !current); if (!open) refreshRef.current() }}
      className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${count && !error ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
      {error ? <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-600 px-1 text-xs font-bold text-white">!</span>
        : count !== null && count > 0 && <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">{count > 99 ? '99+' : count}</span>}
    </button>
    <p role="status" className="sr-only">{label}</p>
    {open && <section id="admin-registration-notifications" aria-labelledby="admin-registration-notifications-title" className="absolute right-0 top-full z-40 mt-3 w-[calc(100vw-3rem)] max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      <div className="border-b border-gray-100 p-4">
        <h2 id="admin-registration-notifications-title" className="font-bold text-gray-900">Solicitudes de registro</h2>
        {!error && count !== null && <p className="mt-1 text-sm text-gray-600">{count === 0 ? 'No hay clientes pendientes de autorización.' : `${count} ${count === 1 ? 'cliente espera' : 'clientes esperan'} tu autorización.`}</p>}
      </div>
      <div className="max-h-[55vh] overflow-y-auto p-4">
        {error ? <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>{error}</p>
          <button type="button" disabled={loading} onClick={() => needsLogin ? router.push('/login') : refreshRef.current()} className="mt-2 min-h-9 font-semibold underline disabled:opacity-50">{needsLogin ? 'Volver a iniciar sesión' : loading ? 'Actualizando...' : 'Reintentar'}</button>
        </div> : data === null ? <p className="py-3 text-sm text-gray-500">Consultando solicitudes...</p>
          : data.count === 0 ? <p className="py-3 text-sm text-gray-500">Cuando un cliente solicite registrarse, lo vas a ver acá.</p>
          : <><ul className="space-y-2">{data.requests.map(customer => <li key={customer.id}>
            <button type="button" onClick={reviewRequests} className="w-full rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-left hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <span className="block break-words text-sm font-semibold text-gray-900">{customer.business_name || customer.name}</span>
              {customer.business_name && <span className="mt-0.5 block break-words text-sm text-gray-600">{customer.name}</span>}
              <span className="mt-1 block text-xs text-gray-500">Solicitud del {registrationDate(customer.created_at)}</span>
              <span className="mt-2 block text-xs font-semibold text-amber-800">Pendiente de autorización · Revisar</span>
            </button>
          </li>)}</ul>{data.count > data.requests.length && <p className="mt-3 text-xs text-gray-500">Mostrando las {data.requests.length} solicitudes más recientes.</p>}</>}
      </div>
      <div className="border-t border-gray-100 p-3"><button type="button" onClick={reviewRequests} className="min-h-11 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Revisar solicitudes en Clientes</button></div>
    </section>}
  </div>
}
