import { publicStructuredData } from '@/lib/public-seo'

export function PublicSeoData({ path }: { path: '/' | '/catalogo' }) {
  return <script
    id={path === '/' ? 'public-home-structured-data' : 'public-catalog-structured-data'}
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(publicStructuredData(path)).replace(/</g, '\\u003c') }}
  />
}
