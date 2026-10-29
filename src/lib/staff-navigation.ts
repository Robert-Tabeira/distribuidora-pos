'use client'

import { useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { staffPathKey, withStaffPath } from '@/lib/staff-paths'

export function useStaffPath() {
  const params = useParams()
  const key = typeof params?.staffKey === 'string' ? params.staffKey : null
  return useCallback((href: string) => withStaffPath(href, key), [key])
}

export function useStaffRouter() {
  const router = useRouter()
  const path = useStaffPath()
  return useMemo(() => ({
    ...router,
    push: (...args: Parameters<typeof router.push>) => router.push(path(args[0]), args[1]),
    replace: (...args: Parameters<typeof router.replace>) => router.replace(path(args[0]), args[1]),
    prefetch: (...args: Parameters<typeof router.prefetch>) => router.prefetch(path(args[0]), args[1]),
  }), [router, path])
}

export function staffFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('X-Staff-Access-Key', staffPathKey(window.location.pathname) || '')
  return fetch(url, { ...init, headers })
}

export function staffLoginUrl() {
  return withStaffPath('/login', staffPathKey(window.location.pathname))
}
