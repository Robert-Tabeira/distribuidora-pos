'use client'

import { useState, useEffect } from 'react'
import { PublicLayout } from '@/components/public-layout'
import { useRouter } from 'next/navigation'
import { HeroSlider } from '@/components/hero-slider'
import { supabase } from '@/lib/supabase'
import type { Category, Product, Discount } from '@/types/database'
import { Icon } from '@/components/ui/icon'
import { getCategoryIconName } from '@/lib/category-icons'
import Link from 'next/link'

interface ProductWithDiscount extends Product {
  discount?: Discount
}

type LandingBlockType = 'content' | 'categories' | 'banner' | 'feature_cards' | 'business_info' | 'image_carousel' | 'product_grid'
interface LandingSectionSettings {
  button_text?: string
  button_url?: string
  background_color?: string
  mode?: 'popular' | 'discounts'
  limit?: number
  show_phone?: boolean
  show_email?: boolean
  show_address?: boolean
  show_business_hours?: boolean
  category_icons?: Record<string, string>
  cards?: Array<{ title: string; description: string; image_url: string; link_url: string; button_text: string }>
  slides?: Array<{ image_url: string; link_url: string }>
}
interface LandingSection {
  id: string
  section_name: string
  title: string | null
  subtitle: string | null
  description: string | null
  image_url: string | null
  is_visible: boolean
  block_type: LandingBlockType
  order_position: number
  settings: LandingSectionSettings
}
interface CategoryForLanding extends Category {
  parent_id: string | null
  show_in_catalog: boolean
  color: string | null
}
interface BusinessSettings {
  phone_number: string | null
  email: string | null
  address: string | null
  business_hours: string | null
}

function LandingBlockRenderer({
  section,
  categories,
  products,
  businessSettings
}: {
  section: LandingSection
  categories: CategoryForLanding[]
  products: ProductWithDiscount[]
  businessSettings: BusinessSettings | null
}) {
  const settings = section.settings || {}
  const heading = section.title || section.section_name

  if (section.block_type === 'categories') {
    const mainCategories = categories.filter(category => !category.parent_id && category.show_in_catalog !== false)
    if (mainCategories.length === 0) return null
    return (
      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">{heading}</h2>
          {section.subtitle && <p className="mt-2 text-center text-gray-600">{section.subtitle}</p>}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {mainCategories.map(category => (
              <Link key={category.id} href={`/catalogo?categoria=${encodeURIComponent(category.id)}`} className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center transition hover:-translate-y-1 hover:border-primary/40 hover:bg-white hover:shadow-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white"><Icon name={getCategoryIconName(category.name, settings.category_icons?.[category.id])} className="h-5 w-5" /></span>
                <span className="text-sm font-semibold text-gray-800">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (section.block_type === 'banner') {
    return (
      <section className="px-4 py-10" style={{ backgroundColor: settings.background_color || '#fff7ed' }}>
        <div className={`mx-auto flex max-w-7xl flex-col overflow-hidden rounded-3xl bg-white/60 shadow-sm md:flex-row ${section.image_url ? 'items-stretch' : 'items-center text-center'}`}>
          {section.image_url && <img src={section.image_url} alt={heading} className="max-h-72 min-h-48 w-full object-cover md:w-2/5" />}
          <div className="flex flex-1 flex-col items-center justify-center p-7 md:p-10">
            <h2 className="text-3xl font-black text-gray-900 sm:text-4xl">{heading}</h2>
            {section.subtitle && <p className="mt-2 text-lg font-semibold text-gray-700">{section.subtitle}</p>}
            {section.description && <p className="mt-3 max-w-2xl whitespace-pre-line text-gray-600">{section.description}</p>}
            {settings.button_text && <Link href={settings.button_url || '/catalogo'} className="mt-5 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-sm transition hover:brightness-95">{settings.button_text}</Link>}
          </div>
        </div>
      </section>
    )
  }

  if (section.block_type === 'feature_cards') {
    return (
      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">{heading}</h2>
          {section.subtitle && <p className="mt-2 text-center text-gray-600">{section.subtitle}</p>}
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {(settings.cards || []).filter(card => card.title || card.image_url || card.description).map((card, index) => (
              <article key={`${section.id}-${index}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {card.image_url && <img src={card.image_url} alt={card.title} className="h-56 w-full object-cover" />}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900">{card.title}</h3>
                  {card.description && <p className="mt-2 whitespace-pre-line leading-6 text-gray-600">{card.description}</p>}
                  {card.button_text && <Link href={card.link_url || '/catalogo'} className="mt-4 inline-flex font-semibold text-primary hover:underline">{card.button_text}<span className="ml-1" aria-hidden="true">→</span></Link>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (section.block_type === 'business_info') {
    const details = [
      settings.show_business_hours !== false && businessSettings?.business_hours ? { icon: 'clock' as const, label: 'Horarios', value: businessSettings.business_hours } : null,
      settings.show_address !== false && businessSettings?.address ? { icon: 'location' as const, label: 'Ubicación', value: businessSettings.address } : null,
      settings.show_phone !== false && businessSettings?.phone_number ? { icon: 'phone' as const, label: 'Contacto', value: businessSettings.phone_number, href: `https://wa.me/${businessSettings.phone_number.replace(/\D/g, '')}` } : null,
      settings.show_email !== false && businessSettings?.email ? { icon: 'mail' as const, label: 'Email', value: businessSettings.email, href: `mailto:${businessSettings.email}` } : null
    ].filter(Boolean) as Array<{ icon: 'clock' | 'location' | 'phone' | 'mail'; label: string; value: string; href?: string }>
    return (
      <section className="bg-gray-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">{heading}</h2>
          {section.subtitle && <p className="mt-2 text-center text-gray-600">{section.subtitle}</p>}
          {section.description && <p className="mx-auto mt-4 max-w-3xl whitespace-pre-line text-center text-gray-600">{section.description}</p>}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {details.map(detail => (
              <div key={detail.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <Icon name={detail.icon} className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-bold text-gray-900">{detail.label}</h3>
                {detail.href ? <a href={detail.href} className="mt-1 block whitespace-pre-line text-sm text-gray-600 hover:text-primary">{detail.value}</a> : <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{detail.value}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (section.block_type === 'image_carousel') {
    const slides = (settings.slides || []).filter(slide => slide.image_url)
    if (slides.length === 0) return null
    return (
      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">{heading}</h2>
          {section.subtitle && <p className="mt-2 text-center text-gray-600">{section.subtitle}</p>}
          {section.description && <p className="mt-3 text-center text-gray-600">{section.description}</p>}
          <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-4">
            {slides.map((slide, index) => (
              <a key={`${section.id}-${index}`} href={slide.link_url || undefined} className="w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200 shadow-sm sm:w-[46%] lg:w-[30%]">
                <img src={slide.image_url} alt={`${heading} ${index + 1}`} className="h-56 w-full object-cover transition hover:scale-[1.02]" />
              </a>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (section.block_type === 'product_grid') {
    const shownProducts = settings.mode === 'discounts' ? products.filter(product => product.discount) : products
    if (shownProducts.length === 0) return null
    return (
      <section className="bg-white px-4 py-14">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">{heading}</h2>
          {section.subtitle && <p className="mt-2 text-center text-gray-600">{section.subtitle}</p>}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {shownProducts.slice(0, settings.limit || 5).map(product => (
              <Link key={product.id} href="/catalogo" className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
                <div className="h-36 bg-gray-100">{product.gallery?.[0] ? <img src={product.gallery[0]} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-300"><Icon name="box" className="h-9 w-9" /></div>}</div>
                <div className="p-3"><h3 className="line-clamp-2 text-sm font-bold text-gray-900">{product.name}</h3>{product.discount && <p className="mt-1 text-xs font-semibold text-red-600">{product.discount.name}</p>}</div>
              </Link>
            ))}
          </div>
          {settings.button_text && <div className="mt-8 text-center"><Link href={settings.button_url || '/catalogo'} className="inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:brightness-95">{settings.button_text}</Link></div>}
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white px-4 py-14">
      <div className={`mx-auto grid max-w-6xl items-center gap-8 ${section.image_url ? 'md:grid-cols-2' : 'max-w-4xl text-center'}`}>
        {section.image_url && <img src={section.image_url} alt={heading} className="max-h-[28rem] min-h-56 w-full rounded-2xl object-cover" />}
        <div><h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">{heading}</h2>{section.subtitle && <p className="mt-3 text-lg font-medium text-primary">{section.subtitle}</p>}{section.description && <p className="mt-4 whitespace-pre-line leading-7 text-gray-600">{section.description}</p>}</div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const [products, setProducts] = useState<ProductWithDiscount[]>([])
  const [landingSections, setLandingSections] = useState<LandingSection[]>([])
  const [categories, setCategories] = useState<CategoryForLanding[]>([])
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [productsRes, discountsRes, sectionsRes, categoriesRes, settingsRes] = await Promise.all([
        supabase.from('products').select('*').eq('status', 'complete'),
        supabase.from('discounts').select('*').eq('is_active', true),
        supabase.from('landing_sections').select('*').order('order_position').order('section_name'),
        supabase.from('categories').select('*').order('order_position'),
        supabase.from('website_settings').select('phone_number,email,address,business_hours').single()
      ])

      if (sectionsRes.data) setLandingSections((sectionsRes.data as LandingSection[]).filter(section => section.is_visible))
      if (categoriesRes.data) setCategories(categoriesRes.data as CategoryForLanding[])
      if (settingsRes.data) setBusinessSettings(settingsRes.data as BusinessSettings)

      if (productsRes.data && discountsRes.data) {
        const productsWithDiscounts = await Promise.all(
          productsRes.data.map(async (product) => {
            const { data: productDiscount } = await supabase
              .from('product_discounts')
              .select('discount_id')
              .eq('product_id', product.id)
              .single()

            if (productDiscount?.discount_id) {
              const discount = discountsRes.data.find(d => d.id === productDiscount.discount_id)
              return { ...product, discount }
            }
            return product
          })
        )
        setProducts(productsWithDiscounts)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  return (
    <PublicLayout>
    <div className="min-h-screen bg-white">
      {/* HERO SLIDER */}
      <HeroSlider />

      {/* BLOQUES EDITABLES DE LANDING */}
      {landingSections.map(section => (
        <LandingBlockRenderer key={section.id} section={section} categories={categories} products={products} businessSettings={businessSettings} />
      ))}

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-black text-2xl mb-2">Los Primos</h3>
              <p className="text-sm">Distribuidora oficial de Sarubbi en Uruguay</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contacto</h4>
              <p className="mb-2 inline-flex items-center gap-2 text-sm"><Icon name="phone" className="h-4 w-4" />WhatsApp: +598 99 123 4567</p>
              <p className="inline-flex items-center gap-2 text-sm"><Icon name="mail" className="h-4 w-4" />info@losprimos.com</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Horarios</h4>
              <p className="text-sm mb-1">Lunes a Viernes: 7:00 - 18:00</p>
              <p className="text-sm">Sábado: 7:00 - 13:00</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2024 Los Primos. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
    </PublicLayout>
  )
}
