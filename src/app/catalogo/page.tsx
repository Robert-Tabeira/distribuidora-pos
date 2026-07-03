'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, Category } from '@/types/database'

// Función de búsqueda fuzzy mejorada
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  // Coincidencia exacta
  if (s1 === s2) return 100
  
  // Si contiene la cadena completa
  if (s1.includes(s2) || s2.includes(s1)) return 90
  
  // Búsqueda por palabras
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)
  
  let wordMatches = 0
  for (const w2 of words2) {
    if (words1.some(w1 => w1.includes(w2) || w2.includes(w1))) {
      wordMatches++
    }
  }
  const wordScore = (wordMatches / Math.max(words2.length, 1)) * 80
  
  // Distancia de Levenshtein simplificada
  const maxLen = Math.max(s1.length, s2.length)
  let matches = 0
  for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) matches++
  }
  const charScore = (matches / maxLen) * 20
  
  return wordScore + charScore
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showProducts, setShowProducts] = useState(false)

  useEffect(() => {
    loadData()
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

  const formatPrice = (price: number | null): string => {
    if (!price) return '-'
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price)
  }

  // Búsqueda fuzzy
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products

    return products
      .map(p => ({
        product: p,
        score: calculateSimilarity(p.name, searchQuery)
      }))
      .filter(item => item.score > 30)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product)
  }, [products, searchQuery])

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

  return (
    <div className="min-h-[100dvh] bg-[#023C7E] text-white">
      {/* Hero Section */}
      {!showProducts ? (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8">
          <div className="text-center space-y-6 max-w-2xl">
            {/* Logo */}
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-bold">
                <span className="text-white">distribuidora</span>{' '}
                <span className="text-[#E11522] drop-shadow-lg" style={{
                  textShadow: '2px 2px 0px white, -2px -2px 0px white, 2px -2px 0px white, -2px 2px 0px white'
                }}>
                  los primos
                </span>
              </h1>
              <p className="text-white/80 text-lg">Los mejores productos al alcance de tu mano</p>
            </div>

            {/* Descripción */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-3">
              <p className="text-white/90 text-center">
                Contamos con una amplia variedad de productos de calidad para tu negocio o hogar
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

            {/* Botón */}
            <button
              onClick={() => setShowProducts(true)}
              className="px-8 py-4 bg-[#E11522] text-white rounded-2xl font-bold text-lg hover:bg-[#C60D1A] active:scale-95 transition-all shadow-lg"
            >
              Ver productos
            </button>

            {/* Decoración */}
            <div className="pt-8 opacity-50">
              <svg className="w-16 h-16 mx-auto animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        /* Catálogo */
        <div className="min-h-[100dvh]">
          {/* Header fijo */}
          <div className="sticky top-0 z-40 bg-[#023C7E]/95 backdrop-blur-md border-b border-white/10">
            <div className="px-4 py-4">
              {/* Logo mini */}
              <button
                onClick={() => {
                  setShowProducts(false)
                  setSearchQuery('')
                }}
                className="mb-4 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>

              {/* Búsqueda */}
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar producto..."
                  className="w-full pl-12 pr-4 py-3 bg-white/10 text-white placeholder-white/50 rounded-xl border border-white/20 focus:border-[#E11522] outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Resultados */}
              {searchQuery && (
                <div className="mt-3 text-sm text-white/70">
                  Encontrados: <span className="font-bold text-[#E11522]">{filteredProducts.length}</span> productos
                </div>
              )}
            </div>
          </div>

          {/* Contenido */}
          <div className="px-4 py-6 pb-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin">
                  <svg className="w-8 h-8 text-[#E11522]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg className="w-16 h-16 text-white/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-white/70">No se encontraron productos</p>
                <p className="text-white/50 text-sm mt-1">Intenta con otra búsqueda</p>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedProducts.map(([categoryName, categoryProducts]) => (
                  <div key={categoryName}>
                    {/* Título categoría */}
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold">
                        {categoryName}
                        <span className="text-[#E11522] ml-2">({categoryProducts.length})</span>
                      </h2>
                      <div className="w-12 h-1 bg-[#E11522] rounded mt-2" />
                    </div>

                    {/* Grid de productos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryProducts.map(product => {
                        const units = Array.isArray(product.unit) ? product.unit : [product.unit]
                        const hasPrices = units.some(unit => {
                          if (unit === 'kg') return product.price_lista1_kg
                          if (unit === 'unidad') return product.price_lista1_unidad
                          if (unit === 'caja') return product.price_lista1_caja
                          if (unit === 'funda') return product.price_lista1_funda
                          if (unit === 'litro') return product.price_lista1_litro
                          return false
                        })

                        return (
                          <div key={product.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-[#E11522] transition-colors">
                            {/* Icono y nombre */}
                            <div className="flex items-start gap-3 mb-3">
                              <div className="text-3xl">{units.map(u => getUnitIcon(u)).join('')}</div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white truncate">{product.name}</h3>
                                {product.location && (
                                  <p className="text-xs text-white/60 mt-1">📍 {product.location}</p>
                                )}
                              </div>
                            </div>

                            {/* Precios */}
                            {hasPrices && (
                              <div className="space-y-2 mb-3 text-sm">
                                {units.map(unit => {
                                  let lista1: number | null = null
                                  let label = ''

                                  if (unit === 'kg') {
                                    lista1 = product.price_lista1_kg
                                    label = '/kg'
                                  } else if (unit === 'unidad') {
                                    lista1 = product.price_lista1_unidad
                                    label = '/ud'
                                  } else if (unit === 'caja') {
                                    lista1 = product.price_lista1_caja
                                    label = '/caja'
                                  } else if (unit === 'funda') {
                                    lista1 = product.price_lista1_funda
                                    label = '/funda'
                                  } else if (unit === 'litro') {
                                    lista1 = product.price_lista1_litro
                                    label = '/l'
                                  }

                                  if (lista1) {
                                    return (
                                      <div key={unit} className="bg-[#E11522]/20 rounded px-2 py-1">
                                        <span className="font-bold text-[#E11522]">{formatPrice(lista1)}</span>
                                        <span className="text-white/70 text-xs ml-1">{label}</span>
                                      </div>
                                    )
                                  }
                                  return null
                                })}
                              </div>
                            )}

                            {/* Tag disponible */}
                            <div className="flex items-center gap-2 text-xs text-green-300">
                              <div className="w-2 h-2 bg-green-300 rounded-full" />
                              Disponible
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
    </div>
  )
}
