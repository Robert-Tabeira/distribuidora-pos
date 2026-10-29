import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { StaffArea } from '@/components/staff-area'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function InternalLayout({ children, params }: { children: ReactNode; params: { staffKey: string } }) {
  return <StaffArea area="/precios" accessKey={params.staffKey}>{children}</StaffArea>
}
