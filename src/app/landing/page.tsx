import LandingContent from './landing-content'
import { loadPublicHero } from '@/lib/public-hero'

export const revalidate = 60

export default async function LandingPage() {
  const initialHero = await loadPublicHero()
  return <LandingContent initialHero={initialHero} />
}
