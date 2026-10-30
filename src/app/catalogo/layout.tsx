import type { ReactNode } from 'react'
import { publicPageMetadata } from '@/lib/public-seo'
import { PublicSeoData } from '@/components/public-seo-data'

export const metadata = publicPageMetadata('/catalogo')

export default function CatalogLayout({ children }: { children: ReactNode }) { return <><PublicSeoData path="/catalogo" />{children}</> }
