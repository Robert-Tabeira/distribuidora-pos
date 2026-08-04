'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-3xl font-black text-blue-900">Los Primos</div>
              <div className="hidden md:block text-sm text-gray-600 font-medium">
                <div>Distribuidora Oficial de Sarubbi</div>
              </div>
            </div>

            <button
              onClick={() => router.push('/catalogo')}
              className="px-6 py-2.5 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-all"
            >
              📦 Ver Catálogo
            </button>

            <button
              onClick={() => router.push('/catalogo')}
              className="relative flex items-center justify-center w-11 h-11 rounded-full bg-blue-900 text-white hover:bg-blue-800 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartTotal > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartTotal}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-16 md:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
                Los mejores productos de la línea Sarubbi y más
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-8 leading-relaxed">
                Distribuidora oficial de Sarubbi. Entregas rápidas, precios mayoristas y atención personalizada 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/catalogo')}
                  className="px-8 py-3.5 bg-white text-blue-900 rounded-xl font-bold hover:bg-gray-100 transition-all text-center text-lg"
                >
                  Ver Catálogo Completo
                </button>
                <a
                  href="https://wa.me/598"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3.5 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 text-lg"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.289-4.909 6.233-4.909 10.33 0 1.455.267 2.858.77 4.187L2.657 22.5l4.383-1.441c1.294.756 2.783 1.166 4.38 1.166 5.64 0 10.233-4.592 10.233-10.233 0-2.65-.997-5.151-2.791-7.035A10.234 10.234 0 0011.052 6.979z" />
                  </svg>
                  Contactar
                </a>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: '📦', label: 'Productos', value: products.length },
                { icon: '⚡', label: 'Disponible', value: '24/7' },
                { icon: '🎁', label: 'Ofertas', value: productsWithDiscount.length }
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-black">{stat.value}</div>
                  <div className="text-sm text-blue-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200"
                >
                  <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.gallery?.[0] ? (
                      <img src={product.gallery[0]} alt={product.name} className="w-full h-full object-cover" />
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
                      <p className="text-xs text-red-600 font-semibold mb-3">{product.discount.name}</p>
                    )}
                    <button
                      onClick={() => {
                        addToCart(product.id)
                        router.push('/catalogo')
                      }}
                      className="w-full py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-all text-sm"
                    >
                      🛒 Agregar
                    </button>
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
                <div key={product.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.gallery?.[0] ? (
                      <img src={product.gallery[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                    )}
                    {product.discount && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2.5 py-1 rounded-full font-black text-xs">
                        -{product.discount.percentage}%
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-3">{product.name}</h3>
                    <button
                      onClick={() => {
                        addToCart(product.id)
                        router.push('/catalogo')
                      }}
                      className="w-full py-2 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-all text-sm"
                    >
                      🛒 Agregar
                    </button>
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
