'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Product, Category, Discount } from '@/types/database'

interface ProductWithDiscount extends Product {
  discount?: Discount
}

export default function CatalogPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithDiscount[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showOnlyDiscounts, setShowOnlyDiscounts] = useState(false)
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number }[]>([])
  const [showCart, setShowCart] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  function removeFromCart(productId: string) {
    saveCart(cartItems.filter(item => item.productId !== productId))
  }

  function updateCartQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      saveCart(cartItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ))
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.product_code?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }

    // Filtrar por categorías
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => selectedCategories.includes(p.category_id || ''))
    }

    // Filtrar por descuentos
    if (showOnlyDiscounts) {
      filtered = filtered.filter(p => p.discount)
    }

    return filtered
  }, [products, searchQuery, selectedCategories, showOnlyDiscounts])

  const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.push('/landing')}
              className="flex items-center gap-2"
            >
              <div className="text-2xl md:text-3xl font-black text-blue-900">Los Primos</div>
            </button>

            {/* Search - Desktop */}
            <div className="flex-1 max-w-md hidden md:block">
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

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

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
          </div>

          {/* Search Mobile */}
          <div className="md:hidden mt-4">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* SIDEBAR FILTROS */}
          <div
            className={`md:block ${
              sidebarOpen ? 'block' : 'hidden'
            } md:col-span-1`}
          >
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm sticky top-24">
              <h3 className="font-black text-lg text-gray-900 mb-6">Filtros</h3>

              {/* Limpiar Filtros */}
              {(selectedCategories.length > 0 || showOnlyDiscounts) && (
                <button
                  onClick={() => {
                    setSelectedCategories([])
                    setShowOnlyDiscounts(false)
                  }}
                  className="w-full mb-6 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
                >
                  Limpiar Filtros
                </button>
              )}

              {/* Categorías */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase">Categorías</h4>
                <div className="space-y-3">
                  {categories.map(category => (
                    <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-900 cursor-pointer"
                      />
                      <span className="text-gray-700 group-hover:text-blue-900 transition-colors text-sm">
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Descuentos */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase">Ofertas</h4>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showOnlyDiscounts}
                    onChange={(e) => setShowOnlyDiscounts(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-900 cursor-pointer"
                  />
                  <span className="text-gray-700 group-hover:text-blue-900 transition-colors text-sm">
                    Solo con Descuento
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* GRID PRODUCTOS */}
          <div className="md:col-span-3">
            {/* Info */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-gray-900">Productos</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} disponible{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <svg className="w-12 h-12 text-blue-900 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-lg text-gray-600 font-medium">No se encontraron productos</p>
                <p className="text-sm text-gray-500 mt-1">Intenta con otros filtros o búsqueda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col h-full cursor-pointer group"
                    onClick={() => addToCart(product.id)}
                  >
                    {/* Imagen */}
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {product.gallery?.[0] ? (
                        <img
                          src={product.gallery[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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

                    {/* Info - Altura fija */}
                    <div className="p-4 flex flex-col flex-1">
                      {product.product_code && (
                        <p className="text-xs text-blue-600 font-semibold mb-1">#{product.product_code}</p>
                      )}

                      <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 flex-1">{product.name}</h3>

                      {product.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">{product.description}</p>
                      )}

                      {product.discount && (
                        <p className="text-xs text-red-600 font-semibold">🎁 {product.discount.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CARRITO FLOTANTE */}
      {showCart && cartTotal > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center md:justify-end p-4 md:p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-gray-200 bg-blue-900 text-white">
              <h3 className="font-black text-lg">Mi Carrito</h3>
              <p className="text-sm text-blue-100">{cartTotal} productos</p>
            </div>

            <div className="max-h-64 overflow-y-auto p-4 space-y-2">
              {cartItems.map(item => {
                const product = products.find(p => p.id === item.productId)
                if (!product) return null
                return (
                  <div key={product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">{product.name}</div>
                      {product.discount && (
                        <div className="text-xs text-red-600">-{product.discount.percentage}%</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(product.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-gray-300 rounded hover:bg-gray-400 text-xs font-bold"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(product.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-gray-300 rounded hover:bg-gray-400 text-xs font-bold"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="ml-2 text-red-500 hover:text-red-700 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-6 border-t border-gray-200 space-y-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `🛒 Pedido desde Los Primos\n\n${cartItems
                    .map(item => {
                      const product = products.find(p => p.id === item.productId)
                      return `• ${product?.name} x${item.quantity}`
                    })
                    .join('\n')}\n\nConfirmar disponibilidad`
                )}`}
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
