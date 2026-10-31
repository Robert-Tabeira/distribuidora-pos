import { loadPublicFavicon } from '@/lib/public-favicon'
import { publicIndexingEnabled } from '@/lib/public-seo'

export const runtime = 'nodejs'
export const revalidate = 60

const MAX_BYTES = 2 * 1024 * 1024
const STORAGE_PREFIX = '/storage/v1/object/public/product-images/favicons/'
const IMAGE_TYPES = new Set(['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml', 'image/webp', 'image/jpeg', 'image/gif'])

function unavailable(status: number) {
  return new Response(null, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } })
}

/** Serve only the configured public favicon, with our own crawler/cache headers. */
export async function GET() {
  try {
    const favicon = await loadPublicFavicon()
    const configuredStorage = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!favicon || !configuredStorage) return unavailable(404)

    const target = new URL(favicon.url)
    const storage = new URL(configuredStorage)
    // Never accept a URL parameter, arbitrary host, private bucket or redirect.
    if (target.protocol !== 'https:' || target.origin !== storage.origin || !target.pathname.startsWith(STORAGE_PREFIX)) return unavailable(404)
    const file = target.pathname.slice(STORAGE_PREFIX.length)
    if (!/^[a-zA-Z0-9_-]+\.(png|ico|svg|webp|jpe?g|gif)$/i.test(file)) return unavailable(404)
    target.search = ''
    target.hash = ''

    const upstream = await fetch(target, { next: { revalidate: 60 }, redirect: 'error', signal: AbortSignal.timeout(5000) })
    if (!upstream.ok || !upstream.body) return unavailable(upstream.status === 404 ? 404 : 502)
    const type = upstream.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || ''
    if (!IMAGE_TYPES.has(type) || Number(upstream.headers.get('content-length')) > MAX_BYTES) {
      await upstream.body.cancel()
      return unavailable(502)
    }

    const reader = upstream.body.getReader()
    const chunks: Uint8Array[] = []
    let length = 0
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        length += value.byteLength
        if (length > MAX_BYTES) { await reader.cancel(); return unavailable(502) }
        chunks.push(value)
      }
    } finally { reader.releaseLock() }
    if (!length) return unavailable(502)
    const buffer = new ArrayBuffer(length)
    const bytes = new Uint8Array(buffer)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }

    // Do not forward Storage's X-Robots-Tag: none (noindex, nofollow).
    return new Response(buffer, { headers: {
      'Content-Type': type,
      'Content-Length': String(length),
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
      'X-Robots-Tag': publicIndexingEnabled() ? 'index, follow' : 'noindex, nofollow',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    } })
  } catch { return unavailable(502) }
}
