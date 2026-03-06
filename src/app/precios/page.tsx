'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Product, Employee, Category } from '@/types/database'

export default function PreciosPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Modal de edición de precio
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [priceKg, setPriceKg] = useState('')
  const [priceUnidad, setPriceUnidad] = useState('')
  const [priceCaja, setPriceCaja] = useState('')
  const [priceFunda, setPriceFunda] = useState('')
  const [priceLitro, setPriceLitro] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('employee')
    if (!stored) {
      router.push('/login')
      return
    }
    const emp = JSON.parse(stored)
    // Solo Admin y Mostrador pueden ver precios
    if (emp.role === 'caja') {
      router.push('/caja')
      return
    }
    setEmployee(emp)
    loadData()
  }, [router])

  async function loadData() {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('*').eq('status', 'complete').order('name'),
      supabase.from('categories').select('*').order('order_position')
    ])

    if (productsRes.data) setProducts(productsRes.data)
    if (categoriesRes.data) setCategories(categoriesRes.data)
    setLoading(false)
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  function openEditModal(product: Product) {
    setEditingProduct(product)
    setPriceKg(product.price_kg?.toString() || '')
    setPriceUnidad(product.price_unidad?.toString() || '')
    setPriceCaja(product.price_caja?.toString() || '')
    setPriceFunda(product.price_funda?.toString() || '')
    setPriceLitro(product.price_litro?.toString() || '')
  }

  function closeEditModal() {
    setEditingProduct(null)
  }

  async function savePrices() {
    if (!editingProduct) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('products')
        .update({
          price_kg: priceKg ? parseFloat(priceKg) : null,
          price_unidad: priceUnidad ? parseFloat(priceUnidad) : null,
          price_caja: priceCaja ? parseFloat(priceCaja) : null,
          price_funda: priceFunda ? parseFloat(priceFunda) : null,
          price_litro: priceLitro ? parseFloat(priceLitro) : null,
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      // Actualizar lista local
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              price_kg: priceKg ? parseFloat(priceKg) : null,
              price_unidad: priceUnidad ? parseFloat(priceUnidad) : null,
              price_caja: priceCaja ? parseFloat(priceCaja) : null,
              price_funda: priceFunda ? parseFloat(priceFunda) : null,
              price_litro: priceLitro ? parseFloat(priceLitro) : null,
            }
          : p
      ))

      closeEditModal()
      if (navigator.vibrate) navigator.vibrate(50)

    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar los precios')
    } finally {
      setSaving(false)
    }
  }

  function formatPrice(price: number | null): string {
    if (!price) return '-'
    return `$${price.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function getCategoryName(categoryId: string | null): string {
    if (!categoryId) return ''
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || ''
  }

  function getUnitIcon(unit: string) {
    switch (unit) {
      case 'kg': return '⚖️'
      case 'litro': return '💧'
      case 'caja': return '📦'
      case 'funda': return '🛍️'
      default: return '🔢'
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="animate-pulse text-text-muted">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-zinc-800 text-white sticky top-0 z-20">
        <div className="px-4 pt-safe-top">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-bold text-lg leading-tight">Lista de Precios</h1>
                <p className="text-sm text-white/70">{products.length} productos</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Contenido */}
      <div className="flex-1 -mt-2 px-4 pb-4 space-y-4">
        {/* Búsqueda */}
        <div className="animate-fade-in">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto..."
              className="input pl-12 pr-12"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-text-light/20 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Lista de productos */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-medium">
              {searchQuery ? 'Sin resultados' : 'No hay productos'}
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden animate-fade-in">
            {filteredProducts.map((product, idx) => {
              const units = Array.isArray(product.unit) ? product.unit : [product.unit]
              const hasPrice = units.some(u => {
                if (u === 'kg') return product.price_kg
                if (u === 'unidad') return product.price_unidad
                if (u === 'caja') return product.price_caja
                if (u === 'funda') return product.price_funda
                if (u === 'litro') return product.price_litro
                return false
              })

              return (
                <div
                  key={product.id}
                  onClick={() => openEditModal(product)}
                  className={`flex items-center gap-4 p-4 active:bg-surface-hover transition-colors cursor-pointer ${
                    idx !== filteredProducts.length - 1 ? 'border-b border-border-light' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-2xl">
                    {units.length > 1 
                      ? units.map(u => getUnitIcon(u)).join('')
                      : getUnitIcon(units[0])
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text truncate">{product.name}</div>
                    <div className="text-sm text-text-muted">
                      {units.map(u => {
                        let price = null
                        let label = ''
                        
                        if (u === 'kg') {
                          price = product.price_kg
                          label = 'kg'
                        } else if (u === 'unidad') {
                          price = product.price_unidad
                          label = 'u'
                        } else if (u === 'caja') {
                          price = product.price_caja
                          label = 'caja'
                        } else if (u === 'funda') {
                          price = product.price_funda
                          label = 'funda'
                        } else if (u === 'litro') {
                          price = product.price_litro
                          label = 'L'
                        }
                        
                        return price ? `${formatPrice(price)}/${label}` : null
                      }).filter(Boolean).join(' • ') || 'Sin precio'}
                      {getCategoryName(product.category_id) && ` • ${getCategoryName(product.category_id)}`}
                    </div>
                  </div>
                  
                  {!hasPrice && (
                    <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de edición de precios */}
      {editingProduct && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" 
          onClick={closeEditModal}
        >
          <div 
            className="bg-surface w-full max-w-lg rounded-t-3xl flex flex-col max-h-[85vh] animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Contenido scrolleable */}
            <div className="overflow-y-auto flex-1 p-6">
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
              
              <h3 className="font-bold text-xl mb-2">{editingProduct.name}</h3>
              <p className="text-text-muted text-sm mb-6">Actualizá los precios que necesites</p>

              <div className="space-y-4">
                {editingProduct.unit.includes('kg') && (
                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2 flex items-center gap-2">
                      <span>⚖️</span>
                      Precio por Kilo
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={priceKg}
                        onChange={(e) => setPriceKg(e.target.value)}
                        placeholder="0.00"
                        className="input pl-8 text-lg"
                      />
                    </div>
                  </div>
                )}

                {editingProduct.unit.includes('unidad') && (
                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2 flex items-center gap-2">
                      <span>🔢</span>
                      Precio por Unidad
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={priceUnidad}
                        onChange={(e) => setPriceUnidad(e.target.value)}
                        placeholder="0.00"
                        className="input pl-8 text-lg"
                      />
                    </div>
                  </div>
                )}

                {editingProduct.unit.includes('caja') && (
                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2 flex items-center gap-2">
                      <span>📦</span>
                      Precio por Caja
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={priceCaja}
                        onChange={(e) => setPriceCaja(e.target.value)}
                        placeholder="0.00"
                        className="input pl-8 text-lg"
                      />
                    </div>
                  </div>
                )}

                {editingProduct.unit.includes('funda') && (
                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2 flex items-center gap-2">
                      <span>🛍️</span>
                      Precio por Funda
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={priceFunda}
                        onChange={(e) => setPriceFunda(e.target.value)}
                        placeholder="0.00"
                        className="input pl-8 text-lg"
                      />
                    </div>
                  </div>
                )}

                {editingProduct.unit.includes('litro') && (
                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2 flex items-center gap-2">
                      <span>💧</span>
                      Precio por Litro
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted font-medium">$</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        value={priceLitro}
                        onChange={(e) => setPriceLitro(e.target.value)}
                        placeholder="0.00"
                        className="input pl-8 text-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones fijos en el fondo */}
            <div className="p-6 pt-3 border-t border-border">
              <div className="flex gap-3">
                <button onClick={closeEditModal} className="btn btn-outline flex-1">
                  Cancelar
                </button>
                <button 
                  onClick={savePrices}
                  disabled={saving}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
