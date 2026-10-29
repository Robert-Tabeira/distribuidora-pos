import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: 'Acceso del personal | Los Primos', robots: { index: false, follow: false } }

export default function StaffLoginLayout({ children }: { children: ReactNode }) { return children }
