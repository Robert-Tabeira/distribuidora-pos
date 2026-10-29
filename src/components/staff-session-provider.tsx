'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import type { StaffProfile } from '@/lib/staff-access-policy'

/** Keeps legacy screens synchronized with the profile validated on the server. */
export function StaffSessionProvider({ employee, children }: { employee: StaffProfile; children: ReactNode }) {
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try { localStorage.setItem('employee', JSON.stringify(employee)); setReady(true); setStorageError(false) }
    catch { setStorageError(true) }
  }, [employee.id, employee.name, employee.role, employee.created_at])

  useEffect(() => {
    let active = true
    let pending = false
    async function verify() {
      if (pending || document.visibilityState === 'hidden') return
      pending = true
      try {
        const response = await fetch('/api/staff-session', { cache: 'no-store', credentials: 'same-origin' })
        if (!active) return
        if (response.status === 401) { try { localStorage.removeItem('employee') } catch {} window.location.replace('/login'); return }
        if (!response.ok) return
        const result = await response.json()
        if (!active) return
        if (result.employee?.id !== employee.id || result.employee?.role !== employee.role) window.location.reload()
        else localStorage.setItem('employee', JSON.stringify(result.employee))
      } catch { /* A network interruption does not authorize a new request or clear a draft. */ }
      finally { pending = false }
    }
    void verify()
    const check = () => { void verify() }
    const timer = window.setInterval(check, 60_000)
    window.addEventListener('focus', check)
    window.addEventListener('pageshow', check)
    document.addEventListener('visibilitychange', check)
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', check); window.removeEventListener('pageshow', check); document.removeEventListener('visibilitychange', check) }
  }, [pathname, employee.id, employee.role])

  if (storageError) return <p className="p-8 text-center">El navegador no permite guardar la sesión del personal. Habilitá el almacenamiento para usar el sistema interno.</p>
  if (!ready) return <p className="p-8 text-center">Comprobando acceso…</p>
  return <>{children}</>
}
