import type { MetadataRoute } from 'next'
import { publicIndexingEnabled, publicSiteOrigin } from '@/lib/public-seo'

export default function robots(): MetadataRoute.Robots {
  if (!publicIndexingEnabled()) return { rules: { userAgent: '*', disallow: '/' } }
  // Crawlers need to read noindex on other pages; never list the private access path.
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${publicSiteOrigin()}/sitemap.xml` }
}
