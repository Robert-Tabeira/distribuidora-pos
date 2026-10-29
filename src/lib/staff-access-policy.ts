export type StaffRole = 'admin' | 'caja' | 'mostrador'
export interface StaffProfile { id: string; name: string; role: StaffRole; created_at: string }

export const STAFF_AREAS: Record<string, readonly StaffRole[]> = {
  '/admin': ['admin'], '/productos': ['admin'], '/empleados': ['admin'],
  '/descuentos': ['admin'], '/ubicaciones': ['admin'],
  '/precios': ['admin', 'mostrador'], '/mostrador': ['admin', 'mostrador'],
  '/reposicion': ['admin', 'mostrador'], '/caja': ['admin', 'caja'], '/historial': ['admin', 'caja'],
}

export function isStaffRole(role: unknown): role is StaffRole {
  return role === 'admin' || role === 'caja' || role === 'mostrador'
}

export function staffArea(pathname: string): string | null {
  return Object.keys(STAFF_AREAS).find(area => pathname === area || pathname.startsWith(`${area}/`)) || null
}

export function staffCanOpen(area: string, role: StaffRole): boolean {
  return STAFF_AREAS[area]?.includes(role) === true
}

export function staffHome(role: StaffRole): string {
  return role === 'admin' ? '/admin' : role === 'caja' ? '/caja' : '/mostrador'
}
