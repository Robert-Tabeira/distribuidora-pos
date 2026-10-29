import { staffArea } from '@/lib/staff-access-policy'

export const STAFF_PATH_PREFIX = '/acceso'
export const validStaffPathKey = (key: string) => /^[a-zA-Z0-9_-]{24,128}$/.test(key)

export function staffPathKey(pathname: string): string | null {
  const parts = pathname.split('/')
  return parts[1] === 'acceso' && validStaffPathKey(parts[2] || '') ? parts[2] : null
}

export function staffInternalPath(pathname: string): string | null {
  const key = staffPathKey(pathname)
  return key ? pathname.slice(`${STAFF_PATH_PREFIX}/${key}`.length) || '/login' : null
}

export function withStaffPath(href: string, key: string | null | undefined): string {
  const pathname = href.split(/[?#]/)[0]
  if (pathname !== '/login' && !staffArea(pathname)) return href
  return key && validStaffPathKey(key) ? `${STAFF_PATH_PREFIX}/${key}${href}` : '/landing'
}
