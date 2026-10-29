import type { HeroSlide, HeroSliderInitialData } from '@/components/hero-slider'

// Only public content is cached here. Never use a service-role key for this fetch.
export async function loadPublicHero(): Promise<HeroSliderInitialData | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  const read = (table: string, params: Record<string, string>) => {
    const target = new URL(`/rest/v1/${table}`, url)
    target.search = new URLSearchParams(params).toString()
    return fetch(target, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    })
  }

  try {
    const [slidesResult, settingsResult] = await Promise.allSettled([
      read('hero_slides', { select: '*', is_active: 'eq.true', order: 'order_position.asc' }),
      read('website_settings', { select: 'hero_autoplay_seconds', limit: '1' }),
    ])
    if (slidesResult.status !== 'fulfilled' || !slidesResult.value.ok) return null
    const rows: unknown = await slidesResult.value.json()
    if (!Array.isArray(rows)) return null
    const slides = rows.filter((row): row is HeroSlide => Boolean(row && typeof row.image_url === 'string' && row.image_url.trim()))
    let autoPlaySeconds = 5
    if (settingsResult.status === 'fulfilled' && settingsResult.value.ok) {
      const settings = await settingsResult.value.json()
      const seconds = Number(settings?.[0]?.hero_autoplay_seconds)
      if (Number.isFinite(seconds) && seconds > 0) autoPlaySeconds = Math.min(15, Math.max(2, seconds))
    }
    return { slides, autoPlaySeconds }
  } catch {
    // The client can still load the hero if Supabase is temporarily unavailable.
    return null
  }
}
