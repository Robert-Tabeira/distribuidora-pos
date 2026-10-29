import { validStaffPathKey, withStaffPath } from '@/lib/staff-paths'

// An obscure route identifier, not an authentication credential. Never import into client modules.
const DEFAULT_STAFF_PATH_KEY = '9a87a1b3ee06514e995bd3d1e10ac1fc'

export function configuredStaffPathKey(): string | null {
  const key = process.env.STAFF_ACCESS_PATH_KEY?.trim() || DEFAULT_STAFF_PATH_KEY
  return validStaffPathKey(key) ? key : null
}

export function staffPathKeyAllowed(key: string | null | undefined): boolean {
  const expected = configuredStaffPathKey()
  return Boolean(expected && key === expected)
}

export function privateStaffPath(href: string): string {
  return withStaffPath(href, configuredStaffPathKey())
}
