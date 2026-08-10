'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { useRouter } from 'next/navigation'
import { HeroSlider } from '@/components/hero-slider'
import { supabase } from '@/lib/supabase'
import type { Product, Discount } from '@/types/database'

interface ProductWithDiscount extends Product {
  discount?: Discount
}

export default function LandingPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithDiscount[]>([])
  const [loading, setLoading] = useState(true)
  const [cartTotal, setCartTotal] = useState(0)

  useEffect(() => {
    loadData()
    loadCart()
  }, [])

  async function loadData() {
    try {
      const [productsRes, discountsRes] = await Promise.all([
        supabase.from('products').select('*').eq('status', 'complete'),
        supabase.from('discounts').select('*').eq('is_active', true)
      ])

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
    } finally {
      setLoading(false)
    }
  }

  function loadCart() {
    const saved = localStorage.getItem('los_primos_cart')
    if (saved) {
      const items = JSON.parse(saved)
      const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      setCartTotal(total)
    }
  }

  function addToCart(productId: string) {
    const saved = localStorage.getItem('los_primos_cart') || '[]'
    const items = JSON.parse(saved)
    const existing = items.find((item: any) => item.productId === productId)
    
    if (existing) {
      existing.quantity += 1
    } else {
      items.push({ productId, quantity: 1 })
    }
    
    localStorage.setItem('los_primos_cart', JSON.stringify(items))
    const total = items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    setCartTotal(total)
  }

  const productsWithDiscount = products.filter(p => p.discount)
  const topProducts = products.slice(0, 5)

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      
      <Header />

      {/* HERO SLIDER */}
      <HeroSlider />

      {/* OFERTAS DESTACADAS */}
      {productsWithDiscount.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-black text-gray-900 mb-2">🎉 Ofertas Especiales</h2>
            <p className="text-gray-600 mb-8 text-lg">No te pierdas nuestras mejores promociones</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {productsWithDiscount.slice(0, 4).map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200 cursor-pointer group"
                  onClick={() => {
                    addToCart(product.id)
                    router.push('/catalogo')
                  }}
                >
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {product.gallery?.[0] ? (
                      <img src={product.gallery[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                    )}
                    {product.discount && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full font-black text-sm shadow-lg">
                        -{product.discount.percentage}%
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                    {product.discount && (
                      <p className="text-xs text-red-600 font-semibold">{product.discount.name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TOP PRODUCTOS */}
      <section className="py-16 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-gray-900 mb-12">🏆 Lo Más Vendido</h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <svg className="w-12 h-12 text-blue-900 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {topProducts.map(product => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group h-full flex flex-col"
                  onClick={() => {
                    addToCart(product.id)
                    router.push('/catalogo')
                  }}
                >
                  <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {product.gallery?.[0] ? (
                      <img src={product.gallery[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                    )}
                    {product.discount && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2.5 py-1 rounded-full font-black text-xs">
                        -{product.discount.percentage}%
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-gray-600 line-clamp-1">{product.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => router.push('/catalogo')}
              className="px-8 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all text-lg"
            >
              Ver Todos los Productos
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">¿Listo para tu pedido?</h2>
          <p className="text-xl text-blue-100 mb-8">Explora nuestro catálogo completo con filtros avanzados</p>
          <button
            onClick={() => router.push('/catalogo')}
            className="inline-block px-8 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all"
          >
            📦 Ir al Catálogo
          </button>
        </div>
      </section>

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
              <p className="text-sm mb-2">📱 WhatsApp: +598 99 123 4567</p>
              <p className="text-sm">📧 info@losprimos.com</p>
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
  )
}
