'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Product, Category, Employee } from '@/types/database'

const IVA_RATE = 0.22 // 22% IVA en Uruguay

export default function PreciosPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal de edición
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editPrices, setEditPrices] = useState<{
    kg: string
    unidad: string
    caja: string
    funda: string
    litro: string
  }>({
    kg: '',
    unidad: '',
    caja: '',
    funda: '',
    litro: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('employee')
    if (!stored) {
      router.push('/login')
      return
    }
    const emp = JSON.parse(stored)
    // Solo Admin y Mostrador pueden acceder
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

  function goBack() {
    if (employee?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/mostrador')
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

  const calculateLista5 = (lista1: number | null): number | null => {
    if (!lista1) return null
    return lista1 / (1 + IVA_RATE)
  }

  const formatPrice = (price: number | null): string => {
    if (!price) return '-'
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  function openEditModal(product: Product) {
    setEditingProduct(product)
    setEditPrices({
      kg: product.price_lista1_kg?.toString() || '',
      unidad: product.price_lista1_unidad?.toString() || '',
      caja: product.price_lista1_caja?.toString() || '',
      funda: product.price_lista1_funda?.toString() || '',
      litro: product.price_lista1_litro?.toString() || ''
    })
  }

  function closeEditModal() {
    setEditingProduct(null)
  }

  async function saveProduct() {
    if (!editingProduct) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('products')
        .update({
          price_lista1_kg: editPrices.kg ? parseFloat(editPrices.kg) : null,
          price_lista1_unidad: editPrices.unidad ? parseFloat(editPrices.unidad) : null,
          price_lista1_caja: editPrices.caja ? parseFloat(editPrices.caja) : null,
          price_lista1_funda: editPrices.funda ? parseFloat(editPrices.funda) : null,
          price_lista1_litro: editPrices.litro ? parseFloat(editPrices.litro) : null,
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      // Actualizar lista local
      setProducts(products.map(p =>
        p.id === editingProduct.id
          ? {
              ...p,
              price_lista1_kg: editPrices.kg ? parseFloat(editPrices.kg) : null,
              price_lista1_unidad: editPrices.unidad ? parseFloat(editPrices.unidad) : null,
              price_lista1_caja: editPrices.caja ? parseFloat(editPrices.caja) : null,
              price_lista1_funda: editPrices.funda ? parseFloat(editPrices.funda) : null,
              price_lista1_litro: editPrices.litro ? parseFloat(editPrices.litro) : null,
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

  // Filtrar productos
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Separar productos con y sin precios
  const productsWithoutPrices = filteredProducts.filter(p => {
    const units = Array.isArray(p.unit) ? p.unit : [p.unit]
    return units.some(unit => {
      if (unit === 'kg') return !p.price_lista1_kg
      if (unit === 'unidad') return !p.price_lista1_unidad
      if (unit === 'caja') return !p.price_lista1_caja
      if (unit === 'funda') return !p.price_lista1_funda
      if (unit === 'litro') return !p.price_lista1_litro
      return false
    })
  })

  const productsWithPrices = filteredProducts.filter(p => !productsWithoutPrices.includes(p))

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
                onClick={goBack}
                className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-bold text-lg leading-tight">Lista de Precios</h1>
                <p className="text-sm text-white/70">Gestión de precios</p>
              </div>
            </div>
          </div>
        </div>

        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Búsqueda */}
      <div className="px-4 -mt-2 mb-4">
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
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 pb-4 space-y-4">
        {/* Sección: Sin precio */}
        {productsWithoutPrices.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="font-bold text-lg">Sin precio</h2>
              <span className="px-2 py-0.5 bg-warning/20 text-warning rounded-full text-xs font-bold">
                {productsWithoutPrices.length}
              </span>
            </div>
            
            <div className="card overflow-hidden">
              {productsWithoutPrices.map((product, idx) => {
                const units = Array.isArray(product.unit) ? product.unit : [product.unit]
                return (
                  <div
                    key={product.id}
                    className={`p-4 ${idx !== productsWithoutPrices.length - 1 ? 'border-b border-border-light' : ''}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-xl">
                        {units.map(u => getUnitIcon(u)).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-text truncate">{product.name}</div>
                        <div className="text-sm text-text-muted">{getCategoryName(product.category_id)}</div>
                      </div>
                      <button
                        onClick={() => openEditModal(product)}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium active:scale-95 transition-transform"
                      >
                        Agregar precio
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sección: Todos los productos */}
        {productsWithPrices.length > 0 && (
          <div>
            <h2 className="font-bold text-lg mb-3">Todos los productos</h2>
            
            <div className="card overflow-hidden">
              {productsWithPrices.map((product, idx) => {
                const units = Array.isArray(product.unit) ? product.unit : [product.unit]
                return (
                  <div
                    key={product.id}
                    className={`p-4 ${idx !== productsWithPrices.length - 1 ? 'border-b border-border-light' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-xl flex-shrink-0">
                        {units.map(u => getUnitIcon(u)).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-text mb-1">{product.name}</div>
                        <div className="text-xs text-text-muted mb-3">{getCategoryName(product.category_id)}</div>
                        
                        {/* Precios por unidad */}
                        <div className="space-y-2">
                          {units.map(unit => {
                            let lista1Price: number | null = null
                            let unitLabel = ''
                            
                            if (unit === 'kg') {
                              lista1Price = product.price_lista1_kg
                              unitLabel = 'Por kilo'
                            } else if (unit === 'unidad') {
                              lista1Price = product.price_lista1_unidad
                              unitLabel = 'Por unidad'
                            } else if (unit === 'caja') {
                              lista1Price = product.price_lista1_caja
                              unitLabel = 'Por caja'
                            } else if (unit === 'funda') {
                              lista1Price = product.price_lista1_funda
                              unitLabel = 'Por funda'
                            } else if (unit === 'litro') {
                              lista1Price = product.price_lista1_litro
                              unitLabel = 'Por litro'
                            }
                            
                            const lista5Price = calculateLista5(lista1Price)
                            
                            return (
                              <div key={unit} className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-emerald-50 px-3 py-2 rounded-lg">
                                  <div className="text-xs text-emerald-700 font-medium mb-0.5">
                                    Lista 1 {unitLabel}
                                  </div>
                                  <div className="font-bold text-emerald-900">
                                    {formatPrice(lista1Price)}
                                  </div>
                                </div>
                                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                                  <div className="text-xs text-blue-700 font-medium mb-0.5">
                                    Lista 5 {unitLabel}
                                  </div>
                                  <div className="font-bold text-blue-900">
                                    {formatPrice(lista5Price)}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        
                        <button
                          onClick={() => openEditModal(product)}
                          className="mt-3 text-sm text-primary font-medium flex items-center gap-1 active:scale-95 transition-transform"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar precios
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sin resultados */}
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-medium">No se encontraron productos</p>
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={closeEditModal}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            
            <h3 className="font-bold text-xl mb-2">{editingProduct.name}</h3>
            <p className="text-sm text-text-muted mb-6">Actualizar precios Lista 1 (con IVA)</p>

            <div className="space-y-4 mb-6">
              {(() => {
                const units = Array.isArray(editingProduct.unit) ? editingProduct.unit : [editingProduct.unit]
                return units.map(unit => {
                  let label = ''
                  let stateKey: 'kg' | 'unidad' | 'caja' | 'funda' | 'litro' = 'unidad'
                  
                  if (unit === 'kg') {
                    label = 'Precio por Kilo'
                    stateKey = 'kg'
                  } else if (unit === 'unidad') {
                    label = 'Precio por Unidad'
                    stateKey = 'unidad'
                  } else if (unit === 'caja') {
                    label = 'Precio por Caja'
                    stateKey = 'caja'
                  } else if (unit === 'funda') {
                    label = 'Precio por Funda'
                    stateKey = 'funda'
                  } else if (unit === 'litro') {
                    label = 'Precio por Litro'
                    stateKey = 'litro'
                  }
                  
                  const lista1 = parseFloat(editPrices[stateKey]) || 0
                  const lista5 = lista1 ? lista1 / (1 + IVA_RATE) : 0
                  
                  return (
                    <div key={unit}>
                      <label className="block text-sm font-semibold text-text-muted mb-2">
                        {getUnitIcon(unit)} {label}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-emerald-700 font-medium mb-1">Lista 1</div>
                          <input
                            type="number"
                            step="0.01"
                            value={editPrices[stateKey]}
                            onChange={(e) => setEditPrices({...editPrices, [stateKey]: e.target.value})}
                            placeholder="0.00"
                            className="input"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-blue-700 font-medium mb-1">Lista 5 (calculada)</div>
                          <div className="h-[42px] flex items-center px-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-semibold">
                            {formatPrice(lista5)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            <div className="flex gap-3">
              <button onClick={closeEditModal} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button
                onClick={saveProduct}
                disabled={saving}
                className="btn btn-primary flex-1"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}