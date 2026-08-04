'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, Category, Discount } from '@/types/database'

interface ProductWithDiscount extends Product {
  discount?: Discount
}

export default function LandingPageComplete() {
  const [products, setProducts] = useState<ProductWithDiscount[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number }[]>([])

  useEffect(() => {
    loadData()
    loadCart()
  }, [])

  async function loadData() {
    try {
      const [productsRes, categoriesRes, discountsRes] = await Promise.all([
        supabase.from('products').select('*').eq('status', 'complete'),
        supabase.from('categories').select('*').order('order_position'),
        supabase.from('discounts').select('*').eq('is_active', true)
      ])

      if (productsRes.data && discountsRes.data) {
        // Asignar descuentos a productos
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

      if (categoriesRes.data) setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function loadCart() {
    const saved = localStorage.getItem('los_primos_cart')
    if (saved) setCartItems(JSON.parse(saved))
  }

  function saveCart(items: typeof cartItems) {
    localStorage.setItem('los_primos_cart', JSON.stringify(items))
    setCartItems(items)
  }

  function addToCart(productId: string) {
    const existing = cartItems.find(item => item.productId === productId)
    if (existing) {
      saveCart(cartItems.map(item =>
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      saveCart([...cartItems, { productId, quantity: 1 }])
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = products

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.product_code?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [products, selectedCategory, searchQuery])

  const productsWithDiscount = products.filter(p => p.discount)
  const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const generateWhatsAppMessage = () => {
    const items = cartItems
      .map(item => {
        const product = products.find(p => p.id === item.productId)
        return `• ${product?.name} x${item.quantity}`
      })
      .join('\n')

    return encodeURIComponent(`🛒 *Nuevo Pedido - Sarubbi*\n\n${items}\n\nConfirmar disponibilidad`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER/NAVEGACIÓN */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl md:text-3xl font-black text-blue-900">Los Primos</div>
              <div className="hidden md:block text-xs md:text-sm text-gray-600 font-medium">
                <div>Distribuidora Oficial</div>
                <div>de Sarubbi</div>
              </div>
            </div>

            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:border-blue-900 text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => setShowCart(!showCart)}
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

          {/* Search mobile */}
          <div className="md:hidden pb-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-900 text-sm"
              />
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-12 md:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4">
                Los mejores productos de la línea Sarubbi y más
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-8">
                Distribuidora oficial de Sarubbi. Entregas rápidas, precios mayoristas y atención 24/7.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#productos"
                  className="px-8 py-3 bg-white text-blue-900 rounded-lg font-bold hover:bg-gray-100 transition-all text-center"
                >
                  Ver Productos
                </a>
                <a
                  href="https://wa.me/598"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.289-4.909 6.233-4.909 10.33 0 1.455.267 2.858.77 4.187L2.657 22.5l4.383-1.441c1.294.756 2.783 1.166 4.38 1.166 5.64 0 10.233-4.592 10.233-10.233 0-2.65-.997-5.151-2.791-7.035A10.234 10.234 0 0011.052 6.979z" />
                  </svg>
                  Contactar
                </a>
              </div>
            </div>

            {/* Hero stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: '📦', label: 'Productos', value: products.length },
                { icon: '🏷️', label: 'Categorías', value: categories.length },
                { icon: '⚡', label: 'Disponible', value: '24/7' }
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

      {/* CATEGORÍAS */}
      <section className="py-12 md:py-16 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-blue-900 mb-8">Todas las Categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`p-4 rounded-xl border-2 font-bold transition-all text-center ${
                selectedCategory === null
                  ? 'border-blue-900 bg-blue-900 text-white shadow-lg'
                  : 'border-gray-300 hover:border-blue-900 text-gray-900'
              }`}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-4 rounded-xl border-2 font-bold transition-all text-center truncate ${
                  selectedCategory === cat.id
                    ? 'border-blue-900 bg-blue-900 text-white shadow-lg'
                    : 'border-gray-300 hover:border-blue-900 text-gray-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* DESCUENTOS DESTACADOS */}
      {productsWithDiscount.length > 0 && (
        <section className="py-12 md:py-16 bg-gradient-to-r from-red-50 via-orange-50 to-red-50 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">🎉 Ofertas Especiales</h2>
            <p className="text-gray-600 mb-8">No te pierdas nuestras mejores promociones</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {productsWithDiscount.slice(0, 4).map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200"
                >
                  <div className="relative h-40 md:h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.gallery?.[0] ? (
                      <img
                        src={product.gallery[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
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
                        setShowCart(true)
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

      {/* PRODUCTOS DESTACADOS */}
      <section id="productos" className="py-12 md:py-16 bg-white px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Productos</h2>
            {searchQuery && (
              <p className="text-sm text-gray-600 mt-2 md:mt-0">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin">
                <svg className="w-12 h-12 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg text-gray-600 font-medium">No se encontraron productos</p>
              <p className="text-sm text-gray-500 mt-1">Intenta con otra búsqueda o categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <div className="relative h-40 md:h-48 bg-gradient-to-br from-gray-100 to-gray-200">
                    {product.gallery?.[0] ? (
                      <img
                        src={product.gallery[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                    )}
                    {product.discount && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2.5 py-1 rounded-full font-black text-xs">
                        -{product.discount.percentage}%
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-2">{product.name}</h3>

                    {product.product_code && (
                      <p className="text-xs text-blue-600 font-semibold mb-2">#{product.product_code}</p>
                    )}

                    {product.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{product.description}</p>
                    )}

                    {product.location && (
                      <p className="text-xs text-gray-500 mb-3">📍 {product.location}</p>
                    )}

                    <button
                      onClick={() => {
                        addToCart(product.id)
                        setShowCart(true)
                      }}
                      className="w-full py-2.5 bg-blue-900 text-white rounded-lg font-bold hover:bg-blue-800 transition-all text-sm"
                    >
                      🛒 Agregar al carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">¿Listo para tu pedido?</h2>
          <p className="text-lg text-blue-100 mb-8">Contáctanos por WhatsApp para atención personalizada</p>
          <a
            href={`https://wa.me/?text=${generateWhatsAppMessage()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-all"
          >
            📱 Contactar por WhatsApp
          </a>
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

      {/* CARRITO FLOTANTE */}
      {showCart && cartTotal > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center md:justify-end p-4 md:p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-black text-lg text-gray-900">Mi Carrito</h3>
              <p className="text-sm text-gray-600">{cartTotal} productos</p>
            </div>

            <div className="max-h-64 overflow-y-auto p-4 space-y-2">
              {cartItems.map(item => {
                const product = products.find(p => p.id === item.productId)
                if (!product) return null
                return (
                  <div key={product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">{product.name}</div>
                    </div>
                    <div className="text-sm font-bold text-blue-900">x{item.quantity}</div>
                  </div>
                )
              })}
            </div>

            <div className="p-6 border-t border-gray-200 space-y-3">
              <a
                href={generateWhatsAppMessage()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.289-4.909 6.233-4.909 10.33 0 1.455.267 2.858.77 4.187L2.657 22.5l4.383-1.441c1.294.756 2.783 1.166 4.38 1.166 5.64 0 10.233-4.592 10.233-10.233 0-2.65-.997-5.151-2.791-7.035A10.234 10.234 0 0011.052 6.979z" />
                </svg>
                Enviar Pedido
              </a>
              <button
                onClick={() => setShowCart(false)}
                className="w-full py-2 bg-gray-200 text-gray-900 rounded-lg font-bold hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
