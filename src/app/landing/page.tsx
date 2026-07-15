'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types/database'

interface CartItem {
  product: Product
  quantity: number
}

export default function CatalogLandingPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

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
    let message = '🛒 *Pedido desde Distribuidora Los Primos*\n\n'
    
    cartItems.forEach(item => {
      message += `• ${item.product.name}`
      if (item.product.product_code) {
        message += ` (#${item.product.product_code})`
      }
      message += ` - Cantidad: ${item.quantity}\n`
    })

    message += '\n¿Cuál es el precio y disponibilidad?'
    
    return encodeURIComponent(message)
  }

  const topProducts = products.slice(0, 6)
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold">
              <span className="text-[#023C7E]">distribuidora</span>
              <span className="text-[#E11522]"> los primos</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#catalogo" className="text-gray-700 hover:text-[#023C7E] transition-colors font-medium">
                Catálogo
              </a>
              <a href="#categorias" className="text-gray-700 hover:text-[#023C7E] transition-colors font-medium">
                Categorías
              </a>
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative flex items-center gap-2 px-4 py-2 bg-[#E11522] text-white rounded-lg hover:bg-[#C60D1A] transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="font-bold">{totalCartItems}</span>
                {totalCartItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 text-[#023C7E] rounded-full text-xs font-bold flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-[#023C7E] via-[#012d5f] to-[#001a3e] text-white overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E11522]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E11522]/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
                  Los mejores productos
                  <span className="block text-[#E11522] mt-2">al alcance de tu mano</span>
                </h1>
                <p className="text-xl text-gray-300 mb-6">
                  Más de {products.length} productos de calidad para tu negocio o hogar. Distribuimos directo desde fábrica.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#catalogo" className="px-8 py-4 bg-[#E11522] text-white rounded-lg font-bold text-lg hover:bg-[#C60D1A] transition-all transform hover:scale-105 text-center">
                  Ver Catálogo
                </a>
                <a href="https://wa.me/598" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 transition-all transform hover:scale-105 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.289-4.909 6.233-4.909 10.33 0 1.455.267 2.858.77 4.187L2.657 22.5l4.383-1.441c1.294.756 2.783 1.166 4.38 1.166 5.64 0 10.233-4.592 10.233-10.233 0-2.65-.997-5.151-2.791-7.035A10.234 10.234 0 0011.052 6.979z" />
                  </svg>
                  WhatsApp
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div>
                  <div className="text-3xl font-bold text-[#E11522]">{products.length}</div>
                  <div className="text-sm text-gray-300">Productos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#E11522]">{categories.length}</div>
                  <div className="text-sm text-gray-300">Categorías</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#E11522]">100%</div>
                  <div className="text-sm text-gray-300">Calidad</div>
                </div>
              </div>
            </div>

            {/* Imagen/Ilustración */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#E11522]/20 to-transparent rounded-2xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-[#E11522]/10 to-[#023C7E]/10 rounded-3xl p-8 border border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: '🥬', label: 'Frescos' },
                    { icon: '🧀', label: 'Lácteos' },
                    { icon: '🥩', label: 'Fiambres' },
                    { icon: '🫒', label: 'Aceites' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:border-[#E11522] transition-colors transform hover:scale-105">
                      <div className="text-4xl mb-2">{item.icon}</div>
                      <div className="text-sm font-medium">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carrito Desplegable */}
      {showCart && cartItems.length > 0 && (
        <div className="fixed top-20 right-4 w-96 max-h-[500px] bg-white rounded-2xl shadow-2xl z-40 flex flex-col border-2 border-[#E11522]">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-lg text-[#023C7E]">Mi Carrito</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cartItems.map(item => (
              <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#023C7E]">{item.product.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center bg-gray-300 rounded hover:bg-gray-400"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-gray-300 rounded hover:bg-gray-400"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="ml-2 text-red-500 hover:text-red-700 text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200">
            <a
              href={`https://wa.me/?text=${generateWhatsAppMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.289-4.909 6.233-4.909 10.33 0 1.455.267 2.858.77 4.187L2.657 22.5l4.383-1.441c1.294.756 2.783 1.166 4.38 1.166 5.64 0 10.233-4.592 10.233-10.233 0-2.65-.997-5.151-2.791-7.035A10.234 10.234 0 0011.052 6.979z" />
              </svg>
              Enviar por WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Beneficios Banner */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: '✅', title: 'Calidad Garantizada', desc: 'Productos directos de fábrica' },
              { icon: '🚚', title: 'Entrega Rápida', desc: 'Entregamos en el mismo día' },
              { icon: '💰', title: 'Mejores Precios', desc: 'Descuentos por volumen' },
              { icon: '📞', title: 'Atención 24/7', desc: 'Soporte vía WhatsApp' },
            ].map((benefit, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-bold text-[#023C7E] mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías Destacadas */}
      <section id="categorias" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#023C7E] mb-4">
              Nuestras Categorías
            </h2>
            <p className="text-xl text-gray-600">Explora todas nuestras líneas de productos</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {categories.slice(0, 6).map((category) => {
              const categoryProducts = products.filter(p => p.category_id === category.id)
              return (
                <div key={category.id} className="group bg-gradient-to-br from-[#023C7E]/5 to-[#E11522]/5 rounded-2xl p-8 border border-gray-200 hover:border-[#E11522] transition-all hover:shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-[#023C7E]">{category.name}</h3>
                    <svg className="w-8 h-8 text-[#E11522] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4">{categoryProducts.length} productos</p>
                  <a href="#catalogo" className="inline-block px-4 py-2 bg-[#E11522] text-white rounded-lg font-semibold hover:bg-[#C60D1A] transition-all">
                    Ver Productos
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Productos Destacados */}
      <section id="catalogo" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#023C7E] mb-4">
              Productos Destacados
            </h2>
            <p className="text-xl text-gray-600">Algunos de nuestros mejores productos</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin">
                <svg className="w-12 h-12 text-[#E11522]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {topProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2">
                  {/* Imagen */}
                  <div className="relative h-48 bg-gradient-to-br from-[#023C7E]/10 to-[#E11522]/10 overflow-hidden">
                    {product.gallery && product.gallery.length > 0 ? (
                      <img
                        src={product.gallery[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        📦
                      </div>
                    )}
                    {product.product_code && (
                      <div className="absolute top-4 right-4 bg-[#E11522] text-white px-3 py-1 rounded-full text-sm font-bold">
                        #{product.product_code}
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#023C7E] mb-2">{product.name}</h3>
                    
                    {product.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                    )}

                    {product.location && (
                      <p className="text-sm text-gray-500 mb-4">📍 {product.location}</p>
                    )}

                    <button
                      onClick={() => {
                        addToCart(product)
                        setShowCart(true)
                      }}
                      className="w-full py-3 bg-[#E11522] text-white rounded-lg font-bold hover:bg-[#C60D1A] transition-all active:scale-95"
                    >
                      🛒 Agregar al Carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <a href="#catalogo" className="inline-block px-8 py-4 bg-[#023C7E] text-white rounded-lg font-bold text-lg hover:bg-[#012d5f] transition-all transform hover:scale-105">
              Ver Catálogo Completo
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#023C7E] to-[#012d5f] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            ¿Listo para hacer tu pedido?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Contactate con nosotros por WhatsApp y obtené atención personalizada
          </p>
          <a
            href={`https://wa.me/598?text=Hola%2C%20quisiera%20informaci%C3%B3n%20sobre%20productos`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-10 py-4 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 transition-all transform hover:scale-105"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold mb-4">Distribuidora Los Primos</h3>
              <p className="text-sm">Los mejores productos al alcance de tu mano</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Enlaces</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#catalogo" className="hover:text-[#E11522]">Catálogo</a></li>
                <li><a href="#categorias" className="hover:text-[#E11522]">Categorías</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Contacto</h4>
              <p className="text-sm">WhatsApp: +598 99 123 4567</p>
              <p className="text-sm">Email: info@losprimos.com</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Síguenos</h4>
              <div className="flex gap-4">
                <a href="#" className="hover:text-[#E11522]">Facebook</a>
                <a href="#" className="hover:text-[#E11522]">Instagram</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm">
              © 2024 Distribuidora Los Primos. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
