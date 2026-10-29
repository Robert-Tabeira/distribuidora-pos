import type { MetadataRoute } from 'next'
import { INDEXABLE_PUBLIC_PATHS, publicCanonical, publicIndexingEnabled } from '@/lib/public-seo'

export default function sitemap(): MetadataRoute.Sitemap {
  return publicIndexingEnabled() ? INDEXABLE_PUBLIC_PATHS.map(path => ({ url: publicCanonical(path) })) : []
}
