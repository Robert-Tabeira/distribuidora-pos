import { publicSiteOrigin } from '@/lib/public-seo'

/** Read only the public favicon setting, without a browser request or private key. */
export async function loadPublicFavicon(): Promise<{ url: string; type?: string } | null> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!base || !key) return null
  try {
    const target = new URL('/rest/v1/website_settings', base)
    target.search = new URLSearchParams({ select: 'favicon_url', limit: '1' }).toString()
    const response = await fetch(target, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60 }, signal: AbortSignal.timeout(2000),
    })
    if (!response.ok) return null
    const rows: unknown = await response.json()
    const value = Array.isArray(rows) ? rows[0]?.favicon_url : null
    if (typeof value !== 'string' || !value.trim()) return null
    const url = new URL(value.trim(), publicSiteOrigin())
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null
    const extension = url.pathname.toLowerCase().split('.').pop() || ''
    const formats: Record<string, string> = { png: 'image/png', ico: 'image/x-icon', svg: 'image/svg+xml', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif' }
    return { url: url.href, type: formats[extension] }
  } catch { return null }
}
