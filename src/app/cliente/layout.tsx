import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = { title: 'Mi cuenta | Los Primos', robots: { index: false, follow: true } }

export default function CustomerLayout({ children }: { children: ReactNode }) { return children }
