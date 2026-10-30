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

export const INDEXABLE_PUBLIC_PATHS = ['/', '/catalogo'] as const
type PublicPath = typeof INDEXABLE_PUBLIC_PATHS[number]
const SITE_NAME = 'Distribuidora Los Primos'
const PAGE_TITLES = { '/': 'Distribuidora Los Primos | Las Toscas', '/catalogo': 'Catálogo de productos | Los Primos' } as const

/** Keep saved menu/footer links working while avoiding the old landing redirect. */
export function publicNavigationHref(href: string): string {
  return href.replace(/^\/landing\/?(?=[?#]|$)/, '/')
}

export function publicCanonical(path: PublicPath): string {
  return new URL(path, publicSiteOrigin()).href
}

export function publicPageMetadata(path: PublicPath): Metadata {
  const landing = path === '/'
  const title = PAGE_TITLES[path]
  const description = landing
    ? 'Distribuidora Los Primos en Las Toscas, Canelones. Explorá el catálogo, consultá precios y armá tu pedido por WhatsApp para coordinarlo con el local.'
    : 'Explorá los productos de Los Primos, prepará una consulta de precios o armá tu pedido y envialo por WhatsApp. Atención en Las Toscas, Canelones.'
  const canonical = publicCanonical(path)
  return {
    title, description,
    alternates: { canonical },
    robots: { index: publicIndexingEnabled(), follow: true },
    openGraph: { type: 'website', locale: 'es_UY', siteName: SITE_NAME, url: canonical, title, description },
    twitter: { card: 'summary', title, description },
  }
}

/** Shared site identity and the catalog's actual place in the public navigation. */
export function publicStructuredData(path: PublicPath) {
  const home = publicCanonical('/')
  const catalog = publicCanonical('/catalogo')
  const websiteId = `${home}#website`
  const pageUrl = publicCanonical(path)
  const pageId = `${pageUrl}#webpage`
  const nodes: Record<string, unknown>[] = [{
    '@type': path === '/' ? 'WebPage' : 'CollectionPage',
    '@id': pageId, url: pageUrl, name: PAGE_TITLES[path], inLanguage: 'es-UY',
    isPartOf: { '@id': websiteId },
    ...(path === '/' ? { hasPart: { '@id': `${catalog}#webpage` } } : { breadcrumb: { '@id': `${catalog}#breadcrumb` } }),
  }]
  if (path === '/') {
    nodes.unshift({ '@type': 'WebSite', '@id': websiteId, url: home, name: SITE_NAME, alternateName: 'Los Primos', inLanguage: 'es-UY' })
  } else {
    nodes.push({ '@type': 'BreadcrumbList', '@id': `${catalog}#breadcrumb`, itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: home },
      { '@type': 'ListItem', position: 2, name: 'Catálogo', item: catalog },
    ] })
  }
  return { '@context': 'https://schema.org', '@graph': nodes }
}

/** Filters and product modals retain their links but are not separate search entries. */
export function publicRequestIndexable(url: Pick<URL, 'origin' | 'pathname' | 'search'>): boolean {
  return publicIndexingEnabled() && url.origin === publicSiteOrigin()
    && INDEXABLE_PUBLIC_PATHS.some(path => path === url.pathname) && !url.search
}
