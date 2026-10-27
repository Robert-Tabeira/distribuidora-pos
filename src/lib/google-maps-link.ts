/** Accepts Google Maps locations and their shared short links without resolving them. */
export function googleMapsLocationLink(value?: string | null): string | null {
  if (!value?.trim()) return null
  try {
    const url = new URL(value.trim())
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null
    const host = url.hostname.toLowerCase()
    const googleDomain = 'google\\.(?:com|[a-z]{2}|(?:com|co)\\.[a-z]{2})'
    const mapsHost = new RegExp(`^maps\\.${googleDomain}$`).test(host)
    const googleHost = new RegExp(`^(?:www\\.)?${googleDomain}$`).test(host)
    const shortLink = host === 'maps.app.goo.gl' || (host === 'goo.gl' && /^\/maps\//.test(url.pathname))
    return mapsHost || (googleHost && /^\/maps(?:\/|$)/.test(url.pathname)) || shortLink ? url.href : null
  } catch {
    return null
  }
}
