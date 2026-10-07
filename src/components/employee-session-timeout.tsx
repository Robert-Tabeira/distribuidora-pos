'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { logoutEmployee } from '@/lib/logout-employee'

const EMPLOYEE_KEY = 'employee'
const LAST_ACTIVITY_KEY = 'employee_last_activity'
const IDLE_TIMEOUT_MS = 30 * 60 * 1000
const SESSION_REFRESH_INTERVAL_MS = 5 * 60 * 1000
const STORAGE_SYNC_INTERVAL_MS = 1000

export function EmployeeSessionTimeout() {
  const router = useRouter()

  useEffect(() => {
    let stopSessionWatch = () => {}
    let watchingSession = false

    const startSessionWatch = () => {
      if (watchingSession || !localStorage.getItem(EMPLOYEE_KEY)) return
      watchingSession = true

      let lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || Date.now()
      let lastStorageSync = 0
      let lastSessionRefresh = 0
      let logoutStarted = false
      let timeoutId: ReturnType<typeof setTimeout> | undefined

      const stop = () => {
        clearTimeout(timeoutId)
        watchingSession = false
        window.removeEventListener('pointerdown', recordActivity)
        window.removeEventListener('keydown', recordActivity)
        window.removeEventListener('wheel', recordActivity)
        window.removeEventListener('touchstart', recordActivity)
        window.removeEventListener('mousemove', recordActivity)
        document.removeEventListener('visibilitychange', checkIdle)
        window.removeEventListener('storage', handleStorage)
      }

      const expireSession = async () => {
        if (logoutStarted) return
        logoutStarted = true
        stop()
        await logoutEmployee()
        router.replace('/login')
      }

      const refreshServerSession = async () => {
        const now = Date.now()
        if (now - lastSessionRefresh < SESSION_REFRESH_INTERVAL_MS) return
        lastSessionRefresh = now
        try {
          const response = await fetch('/api/session/activity', {
            method: 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
          })
          if (response.status === 401 || response.status === 403) await expireSession()
        } catch {
          // Un error de red temporal no cierra la sesión; el servidor igual la valida.
        }
      }

      function checkIdle() {
        const sharedActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || lastActivity
        lastActivity = Math.max(lastActivity, sharedActivity)
        const remaining = IDLE_TIMEOUT_MS - (Date.now() - lastActivity)
        if (remaining <= 0) {
          void expireSession()
          return
        }
        clearTimeout(timeoutId)
        timeoutId = setTimeout(checkIdle, remaining + 25)
      }

      function recordActivity() {
        const now = Date.now()
        const sharedActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || lastActivity
        if (now - Math.max(lastActivity, sharedActivity) >= IDLE_TIMEOUT_MS) {
          void expireSession()
          return
        }

        lastActivity = now
        if (now - lastStorageSync >= STORAGE_SYNC_INTERVAL_MS) {
          localStorage.setItem(LAST_ACTIVITY_KEY, String(now))
          lastStorageSync = now
        }
        checkIdle()
        void refreshServerSession()
      }

      function handleStorage(event: StorageEvent) {
        if (event.key === EMPLOYEE_KEY && !event.newValue) {
          logoutStarted = true
          stop()
          router.replace('/login')
          return
        }
        if (event.key === LAST_ACTIVITY_KEY && event.newValue) checkIdle()
      }

      stopSessionWatch = stop
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        void expireSession()
        return
      }

      window.addEventListener('pointerdown', recordActivity, { passive: true })
      window.addEventListener('keydown', recordActivity)
      window.addEventListener('wheel', recordActivity, { passive: true })
      window.addEventListener('touchstart', recordActivity, { passive: true })
      window.addEventListener('mousemove', recordActivity, { passive: true })
      document.addEventListener('visibilitychange', checkIdle)
      window.addEventListener('storage', handleStorage)
      checkIdle()
      void refreshServerSession()
    }

    const handleSessionStarted = () => startSessionWatch()
    const handleSessionEnded = () => stopSessionWatch()
    window.addEventListener('employee-session-started', handleSessionStarted)
    window.addEventListener('employee-session-ended', handleSessionEnded)
    startSessionWatch()

    return () => {
      window.removeEventListener('employee-session-started', handleSessionStarted)
      window.removeEventListener('employee-session-ended', handleSessionEnded)
      stopSessionWatch()
    }
  }, [router])

  return null
}
