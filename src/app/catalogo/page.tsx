'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types/database'

interface CartItem {
  product: Product
  quantity: number
}

interface FavoriteProduct {
  id: string
  name: string
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProducts, setShowProducts] = useState(false)
  
  // Filters & Sort
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'code'>('name')
  
  // Cart & Favorites
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [showCart, setShowCart] = useState(false)
  
  // Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    loadData()
    loadFavorites()
    loadCart()
  }, [])

  async function loadData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').eq('status', 'complete').order('name'),
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

  function loadFavorites() {
    const saved = localStorage.getItem('los_primos_favorites')
    if (saved) {
      setFavorites(JSON.parse(saved))
    }
  }

  function loadCart() {
    const saved = localStorage.getItem('los_primos_cart')
    if (saved) {
      setCartItems(JSON.parse(saved))
    }
  }

  function saveFavorites(newFavorites: FavoriteProduct[]) {
    localStorage.setItem('los_primos_favorites', JSON.stringify(newFavorites))
    setFavorites(newFavorites)
  }

  function saveCart(newCart: CartItem[]) {
    localStorage.setItem('los_primos_cart', JSON.stringify(newCart))
    setCartItems(newCart)
  }

  function toggleFavorite(product: Product) {
    const isFavorite = favorites.some(f => f.id === product.id)
    
    if (isFavorite) {
      saveFavorites(favorites.filter(f => f.id !== product.id))
    } else {
      saveFavorites([...favorites, { id: product.id, name: product.name }])
    }
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

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sin categoría'
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || 'Sin categoría'
  }

  const getUnitIcon = (unit: string) => {
    switch (unit) {
      case 'kg': return '⚖️'
      case 'litro': return '💧'
      case 'caja': return '📦'
      case 'funda': return '🛍️'
      default: return '🔢'
    }
  }

  // Búsqueda fuzzy
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim()
    const s2 = str2.toLowerCase().trim()
    
    if (s1 === s2) return 100
    if (s1.includes(s2) || s2.includes(s1)) return 90
    
    const words1 = s1.split(/\s+/)
    const words2 = s2.split(/\s+/)
    
    let wordMatches = 0
    for (const w2 of words2) {
      if (words1.some(w1 => w1.includes(w2) || w2.includes(w1))) {
        wordMatches++
      }
    }
    const wordScore = (wordMatches / Math.max(words2.length, 1)) * 80
    
    const maxLen = Math.max(s1.length, s2.length)
    let matches = 0
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) matches++
    }
    const charScore = (matches / maxLen) * 20
    
    return wordScore + charScore
  }

  // Búsqueda por código (#Q1, #F2, etc)
  const isCodeSearch = searchQuery.startsWith('#')
  const searchCode = isCodeSearch ? searchQuery.slice(1).toLowerCase() : ''

  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filtro por categoría
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === selectedCategory)
    }

    // Búsqueda
    if (searchQuery.trim()) {
      if (isCodeSearch) {
        filtered = filtered.filter(p => 
          p.product_code?.toLowerCase().includes(searchCode)
        )
      } else {
        filtered = filtered
          .map(p => ({
            product: p,
            score: calculateSimilarity(p.name, searchQuery)
          }))
          .filter(item => item.score > 30)
          .sort((a, b) => b.score - a.score)
          .map(item => item.product)
      }
    }

    // Ordenamiento
    if (sortBy === 'code') {
      filtered = [...filtered].sort((a, b) => 
        (a.product_code || '').localeCompare(b.product_code || '')
      )
    } else {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    }

    return filtered
  }, [products, selectedCategory, searchQuery, sortBy])

  // Agrupar por categoría
  const groupedProducts = useMemo(() => {
    const grouped: { [key: string]: Product[] } = {}
    
    filteredProducts.forEach(product => {
      const catName = getCategoryName(product.category_id)
      if (!grouped[catName]) {
        grouped[catName] = []
      }
      grouped[catName].push(product)
    })

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]))
  }, [filteredProducts])

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

  const getProductGallery = (product: Product) => {
    // Por ahora usamos emojis, cuando agreguemos URLs de imágenes se mostrarán
    const units = Array.isArray(product.unit) ? product.unit : [product.unit]
    return units.map(u => getUnitIcon(u))
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#023C7E]">
        <div className="animate-pulse text-white">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#023C7E] text-white">
      {/* Hero Section */}
      {!showProducts ? (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8">
          <div className="text-center space-y-6 max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="block">distribuidora</span>
              <span className="text-[#E11522] drop-shadow-lg" style={{
                textShadow: '2px 2px 0px white, -2px -2px 0px white, 2px -2px 0px white, -2px 2px 0px white'
              }}>los primos</span>
            </h1>
            <p className="text-white/80 text-lg">Los mejores productos al alcance de tu mano</p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-3">
              <p className="text-white/90">
                Contamos con una amplia variedad de productos de calidad
              </p>
              <div className="flex justify-center gap-2">
                <span className="px-3 py-1 bg-[#E11522] rounded-full text-sm font-medium">
                  {products.length} productos
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {categories.length} categorías
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowProducts(true)}
              className="px-8 py-4 bg-[#E11522] text-white rounded-2xl font-bold text-lg hover:bg-[#C60D1A] active:scale-95 transition-all shadow-lg"
            >
              Ver productos
            </button>
          </div>
        </div>
      ) : (
        /* Catálogo */
        <div className="min-h-[100dvh]">
          {/* Header fijo */}
          <div className="sticky top-0 z-40 bg-[#023C7E]/95 backdrop-blur-md border-b border-white/10">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setShowProducts(false)}
                  className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Atrás
                </button>

                <button
                  onClick={() => setShowCart(!showCart)}
                  className="relative flex items-center gap-2 px-4 py-2 bg-[#E11522] rounded-xl hover:bg-[#C60D1A] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="text-sm font-bold">{cartItems.length}</span>
                  {cartItems.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-yellow-400 text-[#023C7E] rounded-full text-xs font-bold flex items-center justify-center">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>

              {/* Búsqueda */}
              <div className="relative mb-4">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar producto o #código..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-white/50 rounded-xl border border-white/20 focus:border-[#E11522] outline-none transition-colors"
                />
              </div>

              {/* Filtros */}
              <div className="space-y-3">
                {/* Categorías */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                      selectedCategory === null
                        ? 'bg-[#E11522] text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-[#E11522] text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Ordenamiento */}
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'code')}
                    className="flex-1 px-4 py-2 bg-white/10 text-white rounded-xl border border-white/20 focus:border-[#E11522] outline-none transition-colors"
                  >
                    <option value="name">Ordenar por nombre</option>
                    <option value="code">Ordenar por código</option>
                  </select>
                </div>

                {/* Resultados */}
                {searchQuery && (
                  <div className="text-sm text-white/70">
                    Encontrados: <span className="font-bold text-[#E11522]">{filteredProducts.length}</span> productos
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Carrito desplegable */}
          {showCart && cartItems.length > 0 && (
            <div className="bg-white/5 border-b border-white/10 p-4">
              <h3 className="font-bold mb-3">Mi carrito</h3>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between bg-white/10 p-3 rounded-xl">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{item.product.name}</div>
                      {item.product.product_code && (
                        <div className="text-xs text-white/60">#{item.product.product_code}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white/20 rounded hover:bg-white/30"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white/20 rounded hover:bg-white/30"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <a
                href={`https://wa.me/?text=${generateWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.289-4.909 6.233-4.909 10.33 0 1.455.267 2.858.77 4.187L2.657 22.5l4.383-1.441c1.294.756 2.783 1.166 4.38 1.166 5.64 0 10.233-4.592 10.233-10.233 0-2.65-.997-5.151-2.791-7.035A10.234 10.234 0 0011.052 6.979z" />
                </svg>
                Enviar por WhatsApp
              </a>
            </div>
          )}

          {/* Contenido */}
          <div className="px-4 py-6 pb-8">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-white/70">No se encontraron productos</p>
                <p className="text-white/50 text-sm mt-1">Intenta con otra búsqueda</p>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedProducts.map(([categoryName, categoryProducts]) => (
                  <div key={categoryName}>
                    <h2 className="text-2xl font-bold mb-4">
                      {categoryName}
                      <span className="text-[#E11522] ml-2">({categoryProducts.length})</span>
                    </h2>
                    <div className="w-12 h-1 bg-[#E11522] rounded mb-4" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryProducts.map(product => {
                        const units = Array.isArray(product.unit) ? product.unit : [product.unit]
                        const isFavorite = favorites.some(f => f.id === product.id)

                        return (
                          <div key={product.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-[#E11522] transition-all hover:shadow-lg hover:shadow-[#E11522]/20">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex gap-2">
                                {units.map(u => (
                                  <span key={u} className="text-2xl">{getUnitIcon(u)}</span>
                                ))}
                              </div>
                              <button
                                onClick={() => toggleFavorite(product)}
                                className="text-2xl hover:scale-110 transition-transform"
                              >
                                {isFavorite ? '❤️' : '🤍'}
                              </button>
                            </div>

                            {/* Info */}
                            <h3 className="font-bold text-white mb-1">{product.name}</h3>
                            {product.product_code && (
                              <p className="text-sm text-[#E11522] font-mono mb-2">#{product.product_code}</p>
                            )}
                            {product.location && (
                              <p className="text-xs text-white/60 mb-3">📍 {product.location}</p>
                            )}

                            {/* Botones */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedProduct(product)}
                                className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                              >
                                Ver detalles
                              </button>
                              <button
                                onClick={() => addToCart(product)}
                                className="flex-1 py-2 px-3 bg-[#E11522] hover:bg-[#C60D1A] rounded-lg text-sm font-medium transition-colors"
                              >
                                🛒 Agregar
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setSelectedProduct(null)}>
          <div className="bg-[#023C7E] w-full max-w-lg rounded-t-3xl p-6 max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />

            {/* Galería */}
            <div className="bg-white/10 rounded-2xl p-8 text-center mb-6">
              <div className="text-6xl mb-4">
                {getProductGallery(selectedProduct).join('')}
              </div>
              <p className="text-white/70 text-sm">Producto disponible</p>
            </div>

            {/* Info */}
            <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
            {selectedProduct.product_code && (
              <p className="text-[#E11522] font-mono mb-3">Código: #{selectedProduct.product_code}</p>
            )}

            <div className="space-y-3 mb-6 text-white/80">
              <p><span className="font-semibold">Categoría:</span> {getCategoryName(selectedProduct.category_id)}</p>
              {selectedProduct.location && (
                <p><span className="font-semibold">Ubicación:</span> {selectedProduct.location}</p>
              )}
              <p><span className="font-semibold">Unidades:</span> {Array.isArray(selectedProduct.unit) ? selectedProduct.unit.join(', ') : selectedProduct.unit}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedProduct(null)}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  addToCart(selectedProduct)
                  setSelectedProduct(null)
                  setShowCart(true)
                }}
                className="flex-1 py-3 px-4 bg-[#E11522] hover:bg-[#C60D1A] rounded-xl font-semibold transition-colors"
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
