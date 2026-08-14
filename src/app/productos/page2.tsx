'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Employee, Product } from '@/types/database'

export default function ProductosPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'complete'>('pending')
  
  // Modal de edición
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editName, setEditName] = useState('')
  const [editUnits, setEditUnits] = useState<string[]>(['unidad'])
  const [editCategory, setEditCategory] = useState<string | null>(null)
  const [editLocation, setEditLocation] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editProductCode, setEditProductCode] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [saving, setSaving] = useState(false)

  // Imágenes
  const [editGallery, setEditGallery] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Categorías y ubicaciones
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<string[]>([])

  // Modal de coincidencias
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [showSimilarModal, setShowSimilarModal] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('employee')
    if (!stored) {
      router.push('/login')
      return
    }
    const emp = JSON.parse(stored)
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
    const units = Array.isArray(product.unit) ? product.unit : [product.unit]
    setEditUnits(units.length > 0 ? units : ['unidad'])
    setEditCategory(product.category_id)
    setEditLocation(product.location || '')
    setEditDescription(product.description || '')
    setEditProductCode(product.product_code || '')
    setEditGallery(product.gallery || [])
    setShowLocationDropdown(false)
    setImagePreview(null)
  }

  function closeEditModal() {
    setEditingProduct(null)
    setImagePreview(null)
  }

  function toggleUnit(unit: string) {
    if (editUnits.includes(unit)) {
      if (editUnits.length > 1) {
        setEditUnits(editUnits.filter(u => u !== unit))
      }
    } else {
      setEditUnits([...editUnits, unit])
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editingProduct) return

    setUploadingImage(true)

    try {
      // Validar tamaño (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede pesar más de 5MB')
        return
      }

      // Crear nombre de archivo
      const fileName = `${editingProduct.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      
      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: publicData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      if (publicData?.publicUrl) {
        setEditGallery([...editGallery, publicData.publicUrl])
      }

      // Limpiar
      setImagePreview(null)
      if (e.target) e.target.value = ''

      if (navigator.vibrate) navigator.vibrate(50)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error al subir la imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  function handleImagePreview(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function deleteImage(imageUrl: string) {
    try {
      const pathMatch = imageUrl.match(/product-images\/(.+)$/)
      if (!pathMatch) throw new Error('Invalid image URL')

      const filePath = pathMatch[1]

      const { error } = await supabase.storage
        .from('product-images')
        .remove([filePath])

      if (error) throw error

      setEditGallery(editGallery.filter(img => img !== imageUrl))
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Error al eliminar la imagen')
    }
  }

  function findSimilarProducts(name: string, currentProductId: string): Product[] {
    const stopWords = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'con', 'sin', 'a', 'en']
    
    const words = name
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length >= 3 && !stopWords.includes(word))
    
    if (words.length === 0) return []

    const similar = products.filter(p => {
      if (p.id === currentProductId) return false
      if (p.status !== 'complete') return false
      
      const productWords = p.name
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length >= 3 && !stopWords.includes(word))
      
      return words.some(word => productWords.includes(word))
    })

    return similar
      .map(p => {
        const productWords = p.name.toLowerCase().split(/\s+/)
        const sharedCount = words.filter(word => productWords.includes(word)).length
        return { product: p, sharedCount }
      })
      .sort((a, b) => b.sharedCount - a.sharedCount)
      .slice(0, 4)
      .map(item => item.product)
  }

  async function saveProduct() {
    if (!editingProduct || !editName.trim() || editUnits.length === 0) return

    const similar = findSimilarProducts(editName.trim(), editingProduct.id)
    
    if (similar.length > 0) {
      setSimilarProducts(similar)
      setShowSimilarModal(true)
      return
    }

    await performSave()
  }

  async function performSave() {
    if (!editingProduct || !editName.trim() || editUnits.length === 0) return

    setSaving(true)

    try {
      const newLocation = editLocation.trim() || null
      
      const { error } = await supabase
        .from('products')
        .update({
          name: editName.trim(),
          unit: editUnits,
          category_id: editCategory,
          location: newLocation,
          description: editDescription.trim() || null,
          product_code: editProductCode.trim() || null,
          gallery: editGallery,
          status: 'complete',
        })
        .eq('id', editingProduct.id)

      if (error) throw error

      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              name: editName.trim(), 
              unit: editUnits, 
              category_id: editCategory, 
              location: newLocation,
              description: editDescription.trim() || null,
              product_code: editProductCode.trim() || null,
              gallery: editGallery,
              status: 'complete' as const
            }
          : p
      ))

      if (newLocation && !locations.includes(newLocation)) {
        setLocations([...locations, newLocation].sort())
      }

      closeEditModal()
      setShowSimilarModal(false)
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                    {product.gallery && product.gallery.length > 0 ? (
                      <img
                        src={product.gallery[0]}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="text-lg">📦</span>
                    )}
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
      {editingProduct && !showSimilarModal && (
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

            {/* Código */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-muted mb-2">Código (ej: Q1, F2)</label>
              <input
                type="text"
                value={editProductCode}
                onChange={(e) => setEditProductCode(e.target.value)}
                placeholder="Ej: Q1"
                className="input"
              />
            </div>

            {/* Descripción */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-muted mb-2">Descripción</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe el producto en detalle..."
                rows={3}
                className="input resize-none"
              />
            </div>

            {/* Unidad */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-muted mb-2">
                Se vende por <span className="text-text-light font-normal">(podés elegir varias)</span>
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { value: 'unidad', label: 'Unidad', icon: '🔢' },
                  { value: 'kg', label: 'Kilo', icon: '⚖️' },
                  { value: 'litro', label: 'Litro', icon: '💧' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => toggleUnit(opt.value)}
                    className={`p-4 rounded-xl border-2 transition-all relative ${
                      editUnits.includes(opt.value)
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    {editUnits.includes(opt.value) && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
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
                    onClick={() => toggleUnit(opt.value)}
                    className={`p-4 rounded-xl border-2 transition-all relative ${
                      editUnits.includes(opt.value)
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    {editUnits.includes(opt.value) && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
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
            <div className="mb-4 relative">
              <label className="block text-sm font-semibold text-text-muted mb-2">
                Ubicación <span className="text-text-light">(opcional)</span>
              </label>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => {
                  setEditLocation(e.target.value)
                  setShowLocationDropdown(true)
                }}
                onFocus={() => setShowLocationDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowLocationDropdown(false), 150)
                }}
                placeholder="Ej: Pasillo 3, Heladera"
                className="input"
                autoComplete="off"
              />
              {showLocationDropdown && editLocation.trim() && locations.filter(loc => 
                loc.toLowerCase().includes(editLocation.toLowerCase()) && 
                loc.toLowerCase() !== editLocation.toLowerCase()
              ).length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg z-10 overflow-hidden">
                  {locations
                    .filter(loc => 
                      loc.toLowerCase().includes(editLocation.toLowerCase()) && 
                      loc.toLowerCase() !== editLocation.toLowerCase()
                    )
                    .map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setEditLocation(loc)
                          setShowLocationDropdown(false)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-surface-hover transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{loc}</span>
                      </button>
                    ))
                  }
                </div>
              )}
            </div>

            {/* Galería de imágenes + Vista Previa */}
            <div className="mb-6 grid md:grid-cols-2 gap-4">
              {/* Sección de carga */}
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Galería de Imágenes
                </h4>

                {/* Preview antes de subir */}
                {imagePreview && (
                  <div className="mb-4 relative">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
                    <button
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-danger text-white rounded-full flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Input de archivo */}
                <div className="mb-4">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleImagePreview(e)
                        handleImageUpload(e)
                      }}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <span className="block px-4 py-3 bg-primary text-white rounded-lg text-center font-medium cursor-pointer hover:bg-primary/90 transition-colors disabled:opacity-50">
                      {uploadingImage ? '⏳ Subiendo...' : '📸 Seleccionar imagen'}
                    </span>
                  </label>
                </div>

                {/* Imágenes subidas */}
                {editGallery.length > 0 && (
                  <div>
                    <p className="text-sm text-text-muted mb-2">Imágenes ({editGallery.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {editGallery.map((image, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={image}
                            alt={`Galería ${idx}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => deleteImage(image)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity"
                          >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-1 rounded">
                              Principal
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-text-muted mt-3">
                  💡 Máx 5MB por imagen. Formatos: JPG, PNG, WebP
                </p>
              </div>

              {/* Vista previa tipo card */}
              <div className="p-4 rounded-xl bg-surface border border-border-light">
                <h4 className="font-semibold mb-4">Vista Previa</h4>
                <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200">
                  {/* Imagen de preview */}
                  <div className="relative h-40 bg-gradient-to-br from-blue-100 to-gray-100 overflow-hidden">
                    {editGallery.length > 0 ? (
                      <img
                        src={editGallery[0]}
                        alt={editName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                    {editProductCode && (
                      <div className="absolute top-2 right-2 bg-blue-900 text-white px-2 py-1 rounded text-xs font-bold">
                        #{editProductCode}
                      </div>
                    )}
                  </div>

                  {/* Contenido del card */}
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-2 truncate">
                      {editName || 'Nombre del producto'}
                    </h3>
                    
                    {editDescription && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2 leading-snug">
                        {editDescription}
                      </p>
                    )}

                    {editLocation && (
                      <p className="text-xs text-gray-500 mb-3">📍 {editLocation}</p>
                    )}

                    <div className="flex gap-2">
                      <button className="flex-1 py-1.5 px-3 bg-gray-100 text-blue-900 rounded text-xs font-semibold cursor-not-allowed opacity-70">
                        Ver Detalles
                      </button>
                      <button className="flex-1 py-1.5 px-3 bg-blue-900 text-white rounded text-xs font-semibold cursor-not-allowed opacity-70">
                        🛒 Agregar
                      </button>
                    </div>
                  </div>
                </div>

                {editGallery.length === 0 && (
                  <p className="text-xs text-text-muted mt-4 text-center">
                    Sube imágenes para ver preview
                  </p>
                )}
              </div>
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

      {/* Modal de productos similares */}
      {showSimilarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">¿Es el mismo producto?</h3>
              <p className="text-text-muted">Encontramos productos similares a <span className="font-semibold text-text">"{editName}"</span></p>
            </div>

            <div className="space-y-2 mb-6">
              {similarProducts.map(product => (
                <div key={product.id} className="p-4 rounded-xl bg-bg border border-border">
                  <div className="font-semibold text-text">{product.name}</div>
                  <div className="text-sm text-text-muted mt-1">
                    {getCategoryName(product.category_id)}
                    {product.location && ` • ${product.location}`}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowSimilarModal(false)}
                className="btn btn-outline flex-1"
              >
                Sí, es el mismo
              </button>
              <button 
                onClick={performSave}
                disabled={saving}
                className="btn btn-primary flex-1"
              >
                {saving ? 'Guardando...' : 'No, es diferente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
