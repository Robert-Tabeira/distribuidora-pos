import LandingContent from './landing-content'
import { loadPublicHero } from '@/lib/public-hero'
import { publicPageMetadata } from '@/lib/public-seo'

export const revalidate = 60
export const metadata = publicPageMetadata('/landing')

export default async function LandingPage() {
  const initialHero = await loadPublicHero()
  return <LandingContent initialHero={initialHero} />
}
