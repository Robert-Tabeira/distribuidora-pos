import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { StaffSessionProvider } from '@/components/staff-session-provider'
import { getStaffSession } from '@/lib/staff-server-session'
import { staffCanOpen, staffHome, type StaffProfile } from '@/lib/staff-access-policy'
import { STAFF_COOKIE_NAME, staffServerConfigured } from '@/lib/staff-session-token'
import { staffPathKeyAllowed } from '@/lib/staff-private-path.server'
import { withStaffPath } from '@/lib/staff-paths'

export async function StaffArea({ area, accessKey, children }: { area: string; accessKey: string; children: ReactNode }) {
  if (!staffPathKeyAllowed(accessKey)) redirect('/landing')
  if (!staffServerConfigured()) return <p className="p-8 text-center">El acceso interno requiere configuración del local.</p>
  let employee: StaffProfile | null
  try { employee = await getStaffSession(cookies().get(STAFF_COOKIE_NAME)?.value) }
  catch { return <p className="p-8 text-center">No pudimos comprobar tu acceso. Volvé a intentarlo en unos minutos.</p> }
  if (!employee) redirect(withStaffPath('/login', accessKey))
  if (!staffCanOpen(area, employee.role)) redirect(withStaffPath(staffHome(employee.role), accessKey))
  return <StaffSessionProvider employee={employee}>{children}</StaffSessionProvider>
}
