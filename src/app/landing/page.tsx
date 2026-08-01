'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types/database'

interface CartItem {
  product: Product
  quantity: number
}

export default function SarubbiLandingPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    loadData()
    loadCart()
  }, [])

  async function loadData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').eq('status', 'complete').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('order_position')
      ])

      if (productsRes.data) setProducts(productsRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function loadCart() {
    const saved = localStorage.getItem('los_primos_cart')
    if (saved) {
      setCartItems(JSON.parse(saved))
    }
  }

  function saveCart(newCart: CartItem[]) {
    localStorage.setItem('los_primos_cart', JSON.stringify(newCart))
    setCartItems(newCart)
  }

  function addToCart(product: Product) {
    const existingItem = cartItems.find(item => item.product.id === product.id)
    
    if (existingItem) {
      saveCart(cartItems.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      saveCart([...cartItems, { product, quantity: 1 }])
    }
  }

  function removeFromCart(productId: string) {
    saveCart(cartItems.filter(item => item.product.id !== productId))
  }

  function updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      saveCart(cartItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const generateWhatsAppMessage = () => {
    let message = '🛒 *Nuevo Pedido - Distribuidora de Sarubbi*\n\n'
    
    cartItems.forEach(item => {
      message += `• ${item.product.name}`
      if (item.product.product_code) {
        message += ` (#${item.product.product_code})`
      }
      message += ` x${item.quantity}\n`
    })

    message += '\nPor favor confirmar disponibilidad y precio'
    
    return encodeURIComponent(message)
  }

  const topProducts = products.slice(0, 6)
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-black text-blue-900">Los Primos</div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="text-sm text-gray-600 font-medium">Distribuidora Oficial de Sarubbi</div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#productos" className="text-gray-700 hover:text-blue-900 transition-colors font-medium text-sm">
                Productos
              </a>
              <a href="#marcas" className="text-gray-700 hover:text-blue-900 transition-colors font-medium text-sm">
                Líneas
              </a>
              <a href="#ventajas" className="text-gray-700 hover:text-blue-900 transition-colors font-medium text-sm">
                Ventajas
              </a>
            </div>

            <button
              onClick={() => setShowCart(!showCart)}
              className="relative flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalCartItems > 0 && (
                <span className="font-bold text-sm">{totalCartItems}</span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-700/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Texto */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                  Los mejores productos de la línea Sarubbi y más
                </h1>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Distribuidora oficial de Sarubbi en Uruguay. Entregas rápidas, precios mayoristas y atención personalizada 24/7.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#productos" className="px-8 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 text-center shadow-lg">
                  Ver todos los productos
                </a>
                <a href="https://wa.me/598" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.289-4.909 6.233-4.909 10.33 0 1.455.267 2.858.77 4.187L2.657 22.5l4.383-1.441c1.294.756 2.783 1.166 4.38 1.166 5.64 0 10.233-4.592 10.233-10.233 0-2.65-.997-5.151-2.791-7.035A10.234 10.234 0 0011.052 6.979z" />
                  </svg>
                  Contactar
                </a>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-blue-300">
                <div>
                  <div className="text-3xl font-black text-white">{products.length}+</div>
                  <div className="text-sm text-blue-200">Productos Sarubbi</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{categories.length}</div>
                  <div className="text-sm text-blue-200">Líneas de Productos</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-white">24/7</div>
                  <div className="text-sm text-blue-200">Disponible</div>
                </div>
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '🥫', label: 'Conservas' },
                  { icon: '🌾', label: 'Secos' },
                  { icon: '🧈', label: 'Aceites' },
                  { icon: '🍝', label: 'Pastas' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:border-white/40 transition-all transform hover:scale-105">
                    <div className="text-5xl mb-3">{item.icon}</div>
                    <div className="text-sm font-bold">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carrito Flotante */}
      {showCart && cartItems.length > 0 && (
        <div className="fixed top-24 right-4 w-full max-w-sm max-h-[600px] bg-white rounded-2xl shadow-2xl z-40 flex flex-col border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-bold text-lg text-blue-900">Mi Carrito</h3>
            <p className="text-sm text-gray-600">{totalCartItems} productos</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cartItems.map(item => (
              <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-900">{item.product.name}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center bg-gray-300 rounded hover:bg-gray-400 text-xs"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-gray-300 rounded hover:bg-gray-400 text-xs"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="ml-1 text-red-500 hover:text-red-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200 space-y-3">
            <a
              href={`https://wa.me/?text=${generateWhatsAppMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.289-4.909 6.233-4.909 10.33 0 1.455.267 2.858.77 4.187L2.657 22.5l4.383-1.441c1.294.756 2.783 1.166 4.38 1.166 5.64 0 10.233-4.592 10.233-10.233 0-2.65-.997-5.151-2.791-7.035A10.234 10.234 0 0011.052 6.979z" />
              </svg>
              Enviar Pedido
            </a>
            <button
              onClick={() => setShowCart(false)}
              className="w-full py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Beneficios */}
      <section id="ventajas" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-blue-900 mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-lg text-gray-600">Somos distribuidores oficiales de Sarubbi con ventajas exclusivas</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: '🏭', title: 'Directo de Fábrica', desc: 'Precios mayoristas sin intermediarios' },
              { icon: '🚚', title: 'Entrega Rápida', desc: 'Mismo día en Montevideo' },
              { icon: '✅', title: '100% Original', desc: 'Productos con garantía Sarubbi' },
              { icon: '📞', title: 'Soporte 24/7', desc: 'Atención personalizada por WhatsApp' },
            ].map((benefit, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-blue-900 hover:shadow-lg transition-all">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Líneas de Productos */}
      <section id="marcas" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-blue-900 mb-4">
              Líneas Sarubbi
            </h2>
            <p className="text-lg text-gray-600">Explora todas las categorías de productos disponibles</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {categories.slice(0, 6).map((category) => {
              const categoryProducts = products.filter(p => p.category_id === category.id)
              return (
                <div key={category.id} className="group relative bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-gray-200 hover:border-blue-900 hover:shadow-xl transition-all overflow-hidden">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-100/50 rounded-full blur-3xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative">
                    <h3 className="text-2xl font-bold text-blue-900 mb-2">{category.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{categoryProducts.length} productos disponibles</p>
                    <a href="#productos" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-all">
                      Explorar
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section id="productos" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-blue-900 mb-4">
              Productos Destacados
            </h2>
            <p className="text-lg text-gray-600">Los favoritos de nuestros clientes</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin">
                <svg className="w-12 h-12 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {topProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 group">
                  {/* Imagen */}
                  <div className="relative h-56 bg-gradient-to-br from-blue-100 to-gray-100 overflow-hidden">
                    {product.gallery && product.gallery.length > 0 ? (
                      <img
                        src={product.gallery[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        📦
                      </div>
                    )}
                    {product.product_code && (
                      <div className="absolute top-4 right-4 bg-blue-900 text-white px-3 py-1 rounded-full text-xs font-bold">
                        #{product.product_code}
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-blue-900 mb-2">{product.name}</h3>
                    
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{product.description}</p>
                    )}

                    {product.location && (
                      <p className="text-xs text-gray-500 mb-4">📍 {product.location}</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="flex-1 py-2 px-4 bg-gray-100 text-blue-900 rounded-lg font-semibold hover:bg-gray-200 transition-all text-sm"
                      >
                        Ver Detalles
                      </button>
                      <button
                        onClick={() => {
                          addToCart(product)
                          setShowCart(true)
                        }}
                        className="flex-1 py-2 px-4 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-all text-sm"
                      >
                        🛒 Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-black mb-6">
            ¿Buscas mayorista de Sarubbi?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Tenemos los mejores precios y atención personalizada. Contáctanos ahora.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#productos"
              className="px-10 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all"
            >
              Ver Catálogo
            </a>
            <a
              href="https://wa.me/598"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-600 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.289-4.909 6.233-4.909 10.33 0 1.455.267 2.858.77 4.187L2.657 22.5l4.383-1.441c1.294.756 2.783 1.166 4.38 1.166 5.64 0 10.233-4.592 10.233-10.233 0-2.65-.997-5.151-2.791-7.035A10.234 10.234 0 0011.052 6.979z" />
              </svg>
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-white font-black text-2xl mb-3">Los Primos</h3>
              <p className="text-sm text-gray-500">Distribuidora oficial de Sarubbi en Uruguay con más de 20 años de experiencia.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Navegación</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#productos" className="hover:text-white transition-colors">Productos</a></li>
                <li><a href="#marcas" className="hover:text-white transition-colors">Líneas</a></li>
                <li><a href="#ventajas" className="hover:text-white transition-colors">Ventajas</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contacto</h4>
              <p className="text-sm">📱 WhatsApp: +598 99 123 4567</p>
              <p className="text-sm mt-2">📧 Email: info@distribuidorasarubbi.com</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Horarios</h4>
              <p className="text-sm">Lunes a Viernes: 7:00 - 18:00</p>
              <p className="text-sm mt-2">Sábado: 7:00 - 13:00</p>
              <p className="text-sm mt-2">Domingo: Cerrado</p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm text-gray-500">
              © 2024 Distribuidora Los Primos. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
