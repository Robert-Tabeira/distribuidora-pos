import type { ReactNode } from 'react'
import { publicPageMetadata } from '@/lib/public-seo'

export const metadata = publicPageMetadata('/catalogo')

export default function CatalogLayout({ children }: { children: ReactNode }) { return children }
