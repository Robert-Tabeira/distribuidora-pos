import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { staffPathKeyAllowed } from '@/lib/staff-private-path.server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function PrivatePathLayout({ children, params }: { children: ReactNode; params: { staffKey: string } }) {
  if (!staffPathKeyAllowed(params.staffKey)) redirect('/landing')
  return children
}
