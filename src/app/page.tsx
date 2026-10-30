import LandingContent from './landing/landing-content'
import { loadPublicHero } from '@/lib/public-hero'
import { publicPageMetadata } from '@/lib/public-seo'
import { PublicSeoData } from '@/components/public-seo-data'

export const revalidate = 60
export const metadata = publicPageMetadata('/')

export default async function Home() {
  const initialHero = await loadPublicHero()
  return <><PublicSeoData path="/" /><LandingContent initialHero={initialHero} /></>
}
