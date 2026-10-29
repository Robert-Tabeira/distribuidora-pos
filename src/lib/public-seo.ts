import type { Metadata } from 'next'

const DEFAULT_SITE_ORIGIN = 'https://losprimos.uy'

export function publicSiteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_ORIGIN
  try {
    const url = new URL(configured)
    if (!url.username && !url.password && (url.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && url.protocol === 'http:'))) return url.origin
  } catch { /* Keep the confirmed public domain if the optional setting is malformed. */ }
  return DEFAULT_SITE_ORIGIN
}

export function publicIndexingEnabled(): boolean {
  return process.env.NODE_ENV === 'production' && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production')
}

export const INDEXABLE_PUBLIC_PATHS = ['/landing', '/catalogo'] as const
type PublicPath = typeof INDEXABLE_PUBLIC_PATHS[number]

export function publicCanonical(path: PublicPath): string {
  return new URL(path, publicSiteOrigin()).href
}

export function publicPageMetadata(path: PublicPath): Metadata {
  const landing = path === '/landing'
  const title = landing ? 'Distribuidora Los Primos | Las Toscas' : 'Catálogo de productos | Los Primos'
  const description = landing
    ? 'Distribuidora Los Primos en Las Toscas, Canelones. Explorá el catálogo, consultá precios y armá tu pedido por WhatsApp para coordinarlo con el local.'
    : 'Explorá los productos de Los Primos, prepará una consulta de precios o armá tu pedido y envialo por WhatsApp. Atención en Las Toscas, Canelones.'
  const canonical = publicCanonical(path)
  return {
    title, description,
    alternates: { canonical },
    robots: { index: publicIndexingEnabled(), follow: true },
    openGraph: { type: 'website', locale: 'es_UY', siteName: 'Los Primos', url: canonical, title, description },
    twitter: { card: 'summary', title, description },
  }
}

/** Filters and product modals retain their links but are not separate search entries. */
export function publicRequestIndexable(url: Pick<URL, 'origin' | 'pathname' | 'search'>): boolean {
  return publicIndexingEnabled() && url.origin === publicSiteOrigin()
    && INDEXABLE_PUBLIC_PATHS.some(path => path === url.pathname) && !url.search
}
