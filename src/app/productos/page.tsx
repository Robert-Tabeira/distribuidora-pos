'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Product, Category, Employee } from '@/types/database'

export default function ProductosPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'complete'>('pending')
  
  // Modal de edición
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState<'unidad' | 'kg' | 'litro' | 'caja' | 'funda'>('unidad')
  const [editCategory, setEditCategory] = useState<string | null>(null)
  const [editLocation, setEditLocation] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('employee')
    if (!stored) {
      router.push('/login')
      return
    }
    const emp = JSON.parse(stored)
    // Solo Admin puede acceder a esta página
    if (emp.role !== 'admin') {
      router.push('/mostrador')
      return
    }
    setEmployee(emp)
    loadData()
  }, [router])

  async function loadData() {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('order_position')
    ])

    if (productsRes.data) {
      setProducts(productsRes.data)
      // Extraer ubicaciones únicas
      const uniqueLocations = [...new Set(
        productsRes.data
          .map(p => p.location)
          .filter((loc): loc is string => loc !== null && loc.trim() !== '')
      )].sort()
      setLocations(uniqueLocations)
    }
    if (categoriesRes.data) setCategories(categoriesRes.data)
    setLoading(false)
  }

  function goBack() {
    router.push('/admin')
  }

  const pendingProducts = products.filter(p => p.status === 'pending')
  const completeProducts = products.filter(p => p.status === 'complete')

  function openEditModal(product: Product) {
    setEditingProduct(product)
    setEditName(product.name)
    setEditUnit(product.unit)
    setEditCategory(product.category_id)
    setEditLocation(product.location || '')
  }

  function closeEditModal() {
    setEditingProduct(null)
  }

  async function saveProduct() {
    if (!editingProduct || !editName.trim()) return

    setSaving(true)

    try {
      const newLocation = editLocation.trim() || null
      
      const { error } = await supabase
        .from('products')
        .update({
          name: editName.trim(),
          unit: editUnit,
          category_id: editCategory,
          location: newLocation,
          status: 'complete',
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      // Actualizar lista local
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...p, name: editName.trim(), unit: editUnit, category_id: editCategory, location: newLocation, status: 'complete' as const }
          : p
      ))

      // Agregar ubicación a la lista si es nueva
      if (newLocation && !locations.includes(newLocation)) {
        setLocations([...locations, newLocation].sort())
      }

      closeEditModal()
      if (navigator.vibrate) navigator.vibrate(50)

    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)

      if (error) throw error

      setProducts(products.filter(p => p.id !== product.id))
      if (navigator.vibrate) navigator.vibrate(50)

    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('Error al eliminar el producto')
    }
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

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sin categoría'
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || 'Sin categoría'
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
                onClick={goBack}
                className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-bold text-lg leading-tight">Productos</h1>
                <p className="text-sm text-white/70">Gestión de productos</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Tabs */}
      <div className="px-4 -mt-2 mb-4">
        <div className="flex gap-2 p-1.5 bg-surface rounded-2xl card">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-warning text-white shadow-lg'
                : 'text-text-muted'
            }`}
          >
            Sin agregar
            {pendingProducts.length > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'pending' ? 'bg-white/20' : 'bg-warning/20 text-amber-700'
              }`}>
                {pendingProducts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('complete')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'complete'
                ? 'bg-primary text-white shadow-lg'
                : 'text-text-muted'
            }`}
          >
            Productos
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'complete' ? 'bg-white/20' : 'bg-primary/20 text-primary'
            }`}>
              {completeProducts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 pb-4">
        {activeTab === 'pending' ? (
          /* Sin agregar */
          pendingProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium">No hay productos pendientes</p>
              <p className="text-sm mt-1">¡Todo está al día!</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {pendingProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-4 p-4 ${
                    idx !== pendingProducts.length - 1 ? 'border-b border-border-light' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text truncate">{product.name}</div>
                    <div className="text-sm text-text-muted">Pendiente de configurar</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteProduct(product)}
                      className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Productos completos */
          completeProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="font-medium">No hay productos</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {completeProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-4 p-4 ${
                    idx !== completeProducts.length - 1 ? 'border-b border-border-light' : ''
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-2xl">
                    {getUnitIcon(product.unit)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text truncate">{product.name}</div>
                    <div className="text-sm text-text-muted">
                      {getCategoryName(product.category_id)}
                      {product.location && ` • ${product.location}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteProduct(product)}
                      className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal de edición */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={closeEditModal}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            
            <h3 className="font-bold text-xl mb-6">Editar producto</h3>
            
            {/* Nombre */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-muted mb-2">Nombre</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nombre del producto"
                className="input"
              />
            </div>

            {/* Unidad */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-muted mb-2">Se vende por</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { value: 'unidad', label: 'Unidad', icon: '🔢' },
                  { value: 'kg', label: 'Kilo', icon: '⚖️' },
                  { value: 'litro', label: 'Litro', icon: '💧' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setEditUnit(opt.value as 'unidad' | 'kg' | 'litro' | 'caja' | 'funda')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      editUnit === opt.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    <div className="text-2xl mb-1">{opt.icon}</div>
                    <div className="text-sm font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'caja', label: 'Caja', icon: '📦' },
                  { value: 'funda', label: 'Funda', icon: '🛍️' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setEditUnit(opt.value as 'unidad' | 'kg' | 'litro' | 'caja' | 'funda')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      editUnit === opt.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    <div className="text-2xl mb-1">{opt.icon}</div>
                    <div className="text-sm font-medium">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Categoría */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-muted mb-2">Categoría</label>
              <select
                value={editCategory || ''}
                onChange={(e) => setEditCategory(e.target.value || null)}
                className="input"
              >
                <option value="">Sin categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Ubicación */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-muted mb-2">
                Ubicación <span className="text-text-light">(opcional)</span>
              </label>
              <input
                type="text"
                list="locations-list"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Ej: Pasillo 3, Heladera"
                className="input"
              />
              <datalist id="locations-list">
                {locations.map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
              {locations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {locations.map(loc => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setEditLocation(loc)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        editLocation === loc
                          ? 'bg-primary text-white'
                          : 'bg-bg text-text-muted hover:bg-surface-hover'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={closeEditModal} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button 
                onClick={saveProduct} 
                disabled={saving || !editName.trim()}
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
