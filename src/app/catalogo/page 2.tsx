'use client'

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/header'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Product, Category, Discount } from '@/types/database'

interface ProductWithDiscount extends Product {
  discount?: Discount
}

// Normaliza texto para comparar sin importar tildes/diacríticos
// ("azucar" debe coincidir con "azúcar")
function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
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
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDiscount | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sortOption, setSortOption] = useState<'default' | 'name_asc' | 'name_desc' | 'recent'>('default')

  useEffect(() => {
    loadData()
    loadCart()
  }, [])

  async function loadData() {
    try {
      const [productsRes, categoriesRes, discountsRes] = await Promise.all([
        supabase.from('products').select('*').eq('status', 'complete').eq('visible_in_catalog', true),
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
      const query = normalizeText(searchQuery)
      filtered = filtered.filter(p =>
        normalizeText(p.name).includes(query) ||
        (p.product_code && normalizeText(p.product_code).includes(query)) ||
        (p.description && normalizeText(p.description).includes(query))
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

    // Ordenar
    if (sortOption === 'name_asc') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    } else if (sortOption === 'name_desc') {
      filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name, 'es'))
    } else if (sortOption === 'recent') {
      filtered = [...filtered].sort((a, b) =>
        new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime()
      )
    }

    return filtered
  }, [products, searchQuery, selectedCategories, showOnlyDiscounts, sortOption])

  const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const activeFilterCount = selectedCategories.length + (showOnlyDiscounts ? 1 : 0)

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
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* SIDEBAR FILTROS */}
          <div
            className={`md:block ${
              sidebarOpen ? 'block' : 'hidden'
            } md:col-span-1`}
          >
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm md:sticky md:top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg text-gray-900">Filtros</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Limpiar Filtros */}
              {(selectedCategories.length > 0 || showOnlyDiscounts || searchQuery.trim()) && (
                <button
                  onClick={() => {
                    setSelectedCategories([])
                    setShowOnlyDiscounts(false)
                    setSearchQuery('')
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
            {/* Info y Búsqueda */}
            <div className="mb-6">
              <div className="mb-4">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Productos</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} disponible{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Buscador */}
              <div className="relative mb-3">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <input
                  type="text"
                  placeholder="Buscar por nombre, código o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
                />

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Fila de controles: filtros (mobile) + orden */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 bg-white active:scale-95 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center bg-blue-900 text-white text-xs rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                  className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="default">Ordenar: relevancia</option>
                  <option value="recent">Recién agregados</option>
                  <option value="name_asc">Nombre (A-Z)</option>
                  <option value="name_desc">Nombre (Z-A)</option>
                </select>
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
                <p className="text-sm text-gray-500 mt-2">
                  {searchQuery && `No coinciden con: "${searchQuery}"`}
                  {selectedCategories.length > 0 && ` en las categorías seleccionadas`}
                  {showOnlyDiscounts && ` con descuento`}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategories([])
                    setShowOnlyDiscounts(false)
                  }}
                  className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-all text-sm font-semibold"
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="relative bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col h-full cursor-pointer group"
                    onClick={() => {
                      setSelectedProduct(product)
                      setActiveImageIndex(0)
                    }}
                  >
                    {/* Imagen */}
                    <div className="relative h-28 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      {product.gallery?.[0] ? (
                        <img
                          src={product.gallery[0]}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                      )}
                      {product.discount && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-black text-[10px] sm:text-sm shadow-lg">
                          -{product.discount.percentage}%
                        </div>
                      )}
                    </div>

                    {/* Info - Altura fija */}
                    <div className="p-2.5 sm:p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 mb-1 sm:mb-2 flex-1">{product.name}</h3>

                      {product.description && (
                        <p className="hidden sm:block text-xs text-gray-600 line-clamp-2 mb-2">{product.description}</p>
                      )}

                      {product.discount && (
                        <p className="text-[10px] sm:text-xs text-red-600 font-semibold">🎁 {product.discount.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETALLE DE PRODUCTO */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Galería */}
            <div className="relative h-64 sm:h-80 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
              {selectedProduct.gallery && selectedProduct.gallery.length > 0 ? (
                <img
                  src={selectedProduct.gallery[activeImageIndex]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl">📦</div>
              )}

              {selectedProduct.discount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-black text-sm shadow-lg">
                  -{selectedProduct.discount.percentage}%
                </div>
              )}

              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Flechas prev/next, solo si hay más de una foto */}
              {selectedProduct.gallery && selectedProduct.gallery.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveImageIndex(i => (i === 0 ? selectedProduct.gallery!.length - 1 : i - 1))
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setActiveImageIndex(i => (i === selectedProduct.gallery!.length - 1 ? 0 : i + 1))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Miniaturas */}
            {selectedProduct.gallery && selectedProduct.gallery.length > 1 && (
              <div className="flex gap-2 px-4 pt-3 overflow-x-auto flex-shrink-0">
                {selectedProduct.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeImageIndex ? 'border-blue-900' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain bg-gray-50" />
                  </button>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="p-5 overflow-y-auto">
              <h3 className="font-black text-xl text-gray-900 mb-2">{selectedProduct.name}</h3>

              {selectedProduct.description && (
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{selectedProduct.description}</p>
              )}

              {selectedProduct.discount && (
                <p className="text-sm text-red-600 font-semibold mb-4">🎁 {selectedProduct.discount.name}</p>
              )}

              {/* Acá van a ir más adelante los emblemas (celíacos, dietético,
                  sin sal, sin lactosa, etc.) que se puedan cargar por producto */}

              {/* El botón "Agregar al carrito" se sacó temporalmente hasta
                  que armemos la lista de compra para enviar por WhatsApp */}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
