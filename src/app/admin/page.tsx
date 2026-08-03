'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Employee, Discount, Product } from '@/types/database'

interface SpecialDiscount {
  id: string
  product_id: string
  name: string
  description: string | null
  original_price: number | null
  fixed_price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProductInfo extends Product {
  specialDiscount?: SpecialDiscount
}

export default function DiscountsAdminPageV2() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [specialDiscounts, setSpecialDiscounts] = useState<SpecialDiscount[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'percentage' | 'special'>('percentage')

  // Modal para elegir tipo de descuento
  const [showTypeModal, setShowTypeModal] = useState(false)

  // Modal de descuentos porcentuales
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [discountForm, setDiscountForm] = useState({ name: '', description: '', percentage: 0, color: '#FF6B6B' })
  const [saving, setSaving] = useState(false)

  // Modal de asignar porcentaje a productos
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null)
  const [productsWithDiscount, setProductsWithDiscount] = useState<string[]>([])
  const [assigningSaving, setAssigningSaving] = useState(false)

  // Modal de descuentos especiales
  const [editingSpecialDiscount, setEditingSpecialDiscount] = useState<SpecialDiscount | null>(null)
  const [showSpecialModal, setShowSpecialModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [specialForm, setSpecialForm] = useState({ name: '', description: '', original_price: 0, fixed_price: 0 })
  const [savingSpecial, setSavingSpecial] = useState(false)

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
    try {
      const [discountsRes, productsRes, specialDiscountsRes] = await Promise.all([
        supabase.from('discounts').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('status', 'complete').order('name'),
        supabase.from('special_product_discounts').select('*').eq('is_active', true)
      ])

      if (discountsRes.data) setDiscounts(discountsRes.data)
      if (productsRes.data) setProducts(productsRes.data)
      if (specialDiscountsRes.data) setSpecialDiscounts(specialDiscountsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    router.push('/admin')
  }

  // ===== DESCUENTOS PORCENTUALES =====

  function openNewDiscount() {
    setShowTypeModal(true)
  }

  function startPercentageDiscount() {
    setEditingDiscount(null)
    setDiscountForm({ name: '', description: '', percentage: 0, color: '#FF6B6B' })
    setShowTypeModal(false)
    setShowDiscountModal(true)
  }

  function openEditDiscount(discount: Discount) {
    setEditingDiscount(discount)
    setDiscountForm({
      name: discount.name,
      description: discount.description || '',
      percentage: discount.percentage,
      color: discount.color || '#FF6B6B'
    })
    setShowDiscountModal(true)
  }

  async function saveDiscount() {
    if (!discountForm.name.trim() || discountForm.percentage <= 0) {
      alert('Completa los campos requeridos')
      return
    }

    setSaving(true)
    try {
      if (editingDiscount) {
        const { error } = await supabase
          .from('discounts')
          .update({
            name: discountForm.name.trim(),
            description: discountForm.description.trim() || null,
            percentage: discountForm.percentage,
            color: discountForm.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDiscount.id)

        if (error) throw error

        setDiscounts(discounts.map(d =>
          d.id === editingDiscount.id
            ? {
                ...d,
                name: discountForm.name.trim(),
                description: discountForm.description.trim() || null,
                percentage: discountForm.percentage,
                color: discountForm.color,
                updated_at: new Date().toISOString()
              }
            : d
        ))
      } else {
        const { data, error } = await supabase
          .from('discounts')
          .insert([{
            name: discountForm.name.trim(),
            description: discountForm.description.trim() || null,
            percentage: discountForm.percentage,
            color: discountForm.color,
            is_active: true
          }])
          .select()

        if (error) throw error
        if (data) setDiscounts([data[0], ...discounts])
      }

      setShowDiscountModal(false)
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (error) {
      console.error('Error saving discount:', error)
      alert('Error al guardar el descuento')
    } finally {
      setSaving(false)
    }
  }

  async function deleteDiscount(discount: Discount) {
    if (!confirm(`¿Eliminar descuento "${discount.name}"?`)) return

    try {
      const { error } = await supabase
        .from('discounts')
        .delete()
        .eq('id', discount.id)

      if (error) throw error

      setDiscounts(discounts.filter(d => d.id !== discount.id))
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (error) {
      console.error('Error deleting discount:', error)
      alert('Error al eliminar el descuento')
    }
  }

  async function openAssignModal(discount: Discount) {
    setSelectedDiscount(discount)

    try {
      const { data } = await supabase
        .from('product_discounts')
        .select('product_id')
        .eq('discount_id', discount.id)

      if (data) {
        setProductsWithDiscount(data.map(pd => pd.product_id))
      }
    } catch (error) {
      console.error('Error loading products:', error)
    }

    setShowAssignModal(true)
  }

  function toggleProductDiscount(productId: string) {
    if (productsWithDiscount.includes(productId)) {
      setProductsWithDiscount(productsWithDiscount.filter(id => id !== productId))
    } else {
      setProductsWithDiscount([...productsWithDiscount, productId])
    }
  }

  async function saveProductDiscounts() {
    if (!selectedDiscount) return

    setAssigningSaving(true)
    try {
      await supabase
        .from('product_discounts')
        .delete()
        .eq('discount_id', selectedDiscount.id)

      if (productsWithDiscount.length > 0) {
        const { error } = await supabase
          .from('product_discounts')
          .insert(
            productsWithDiscount.map(productId => ({
              product_id: productId,
              discount_id: selectedDiscount.id
            }))
          )

        if (error) throw error
      }

      setShowAssignModal(false)
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (error) {
      console.error('Error saving product discounts:', error)
      alert('Error al asignar descuentos')
    } finally {
      setAssigningSaving(false)
    }
  }

  // ===== DESCUENTOS ESPECIALES =====

  function startSpecialDiscount() {
    setEditingSpecialDiscount(null)
    setSelectedProduct(null)
    setSpecialForm({ name: '', description: '', original_price: 0, fixed_price: 0 })
    setShowTypeModal(false)
    setShowSpecialModal(true)
  }

  function openEditSpecialDiscount(discount: SpecialDiscount) {
    const product = products.find(p => p.id === discount.product_id)
    setEditingSpecialDiscount(discount)
    setSelectedProduct(product || null)
    setSpecialForm({
      name: discount.name,
      description: discount.description || '',
      original_price: discount.original_price || 0,
      fixed_price: discount.fixed_price
    })
    setShowSpecialModal(true)
  }

  async function saveSpecialDiscount() {
    if (!selectedProduct || !specialForm.name.trim() || specialForm.fixed_price <= 0) {
      alert('Selecciona un producto y completa los precios')
      return
    }

    setSavingSpecial(true)
    try {
      if (editingSpecialDiscount) {
        const { error } = await supabase
          .from('special_product_discounts')
          .update({
            name: specialForm.name.trim(),
            description: specialForm.description.trim() || null,
            original_price: specialForm.original_price || null,
            fixed_price: specialForm.fixed_price,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSpecialDiscount.id)

        if (error) throw error

        setSpecialDiscounts(specialDiscounts.map(d =>
          d.id === editingSpecialDiscount.id
            ? {
                ...d,
                name: specialForm.name.trim(),
                description: specialForm.description.trim() || null,
                original_price: specialForm.original_price || null,
                fixed_price: specialForm.fixed_price,
                updated_at: new Date().toISOString()
              }
            : d
        ))
      } else {
        const { data, error } = await supabase
          .from('special_product_discounts')
          .insert([{
            product_id: selectedProduct.id,
            name: specialForm.name.trim(),
            description: specialForm.description.trim() || null,
            original_price: specialForm.original_price || null,
            fixed_price: specialForm.fixed_price,
            is_active: true
          }])
          .select()

        if (error) throw error
        if (data) setSpecialDiscounts([data[0], ...specialDiscounts])
      }

      setShowSpecialModal(false)
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (error) {
      console.error('Error saving special discount:', error)
      alert('Error al guardar el descuento especial')
    } finally {
      setSavingSpecial(false)
    }
  }

  async function deleteSpecialDiscount(discount: SpecialDiscount) {
    if (!confirm(`¿Eliminar este descuento especial?`)) return

    try {
      const { error } = await supabase
        .from('special_product_discounts')
        .delete()
        .eq('id', discount.id)

      if (error) throw error

      setSpecialDiscounts(specialDiscounts.filter(d => d.id !== discount.id))
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (error) {
      console.error('Error deleting special discount:', error)
      alert('Error al eliminar el descuento')
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
                onClick={goBack}
                className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-bold text-lg leading-tight">Descuentos & Ofertas</h1>
                <p className="text-sm text-white/70">Gestiona tus promociones</p>
              </div>
            </div>
            <button
              onClick={openNewDiscount}
              className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 active:scale-95 transition-all"
            >
              + Nuevo
            </button>
          </div>
        </div>

        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Tabs */}
      <div className="px-4 -mt-2 mb-4">
        <div className="flex gap-2 p-1.5 bg-surface rounded-2xl card">
          <button
            onClick={() => setActiveTab('percentage')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'percentage'
                ? 'bg-primary text-white shadow-lg'
                : 'text-text-muted'
            }`}
          >
            Porcentuales
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'percentage' ? 'bg-white/20' : 'bg-primary/20 text-primary'
            }`}>
              {discounts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('special')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
              activeTab === 'special'
                ? 'bg-primary text-white shadow-lg'
                : 'text-text-muted'
            }`}
          >
            Especiales
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'special' ? 'bg-white/20' : 'bg-primary/20 text-primary'
            }`}>
              {specialDiscounts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 pb-4">
        {activeTab === 'percentage' ? (
          // DESCUENTOS PORCENTUALES
          discounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium">No hay descuentos porcentuales</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {discounts.map((discount, idx) => (
                <div
                  key={discount.id}
                  className={`flex items-center gap-4 p-4 ${
                    idx !== discounts.length - 1 ? 'border-b border-border-light' : ''
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: discount.color || '#FF6B6B' }}
                  >
                    -{discount.percentage}%
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text">{discount.name}</div>
                    {discount.description && (
                      <div className="text-sm text-text-muted">{discount.description}</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openAssignModal(discount)}
                      className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center active:scale-90 transition-transform"
                      title="Asignar a productos"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </button>

                    <button
                      onClick={() => openEditDiscount(discount)}
                      className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => deleteDiscount(discount)}
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
          // DESCUENTOS ESPECIALES
          specialDiscounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <p className="font-medium">No hay descuentos especiales</p>
            </div>
          ) : (
            <div className="space-y-4">
              {specialDiscounts.map(discount => {
                const product = products.find(p => p.id === discount.product_id)
                const savings = discount.original_price ? (discount.original_price - discount.fixed_price) : null

                return (
                  <div key={discount.id} className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-text">{discount.name}</h3>
                        {product && (
                          <p className="text-sm text-text-muted">{product.name}</p>
                        )}
                        {discount.description && (
                          <p className="text-xs text-gray-600 mt-1">{discount.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {discount.original_price && (
                          <div className="text-xs text-text-muted line-through">${discount.original_price.toFixed(2)}</div>
                        )}
                        <div className="text-lg font-bold text-primary">${discount.fixed_price.toFixed(2)}</div>
                        {savings && (
                          <div className="text-xs text-green-600 font-semibold">Ahorra ${savings.toFixed(2)}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditSpecialDiscount(discount)}
                        className="flex-1 py-2 px-3 bg-primary/10 text-primary rounded-lg font-semibold hover:bg-primary/20 transition-colors text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteSpecialDiscount(discount)}
                        className="flex-1 py-2 px-3 bg-danger/10 text-danger rounded-lg font-semibold hover:bg-danger/20 transition-colors text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* ===== MODALES ===== */}

      {/* Modal para elegir tipo de descuento */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowTypeModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6 text-center">¿Qué tipo de descuento quieres crear?</h3>

            <div className="space-y-3">
              {/* Porcentual */}
              <button
                onClick={startPercentageDiscount}
                className="w-full p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 transition-all active:scale-95"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-900 flex items-center justify-center text-white text-xl font-bold">%</div>
                  <div className="text-left">
                    <h4 className="font-bold text-blue-900">Descuento Porcentual</h4>
                    <p className="text-sm text-blue-700">Aplica un % de descuento a múltiples productos</p>
                  </div>
                </div>
              </button>

              {/* Especial */}
              <button
                onClick={startSpecialDiscount}
                className="w-full p-4 rounded-xl border-2 border-purple-200 bg-purple-50 hover:border-purple-400 hover:bg-purple-100 transition-all active:scale-95"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-900 flex items-center justify-center text-white text-xl font-bold">💰</div>
                  <div className="text-left">
                    <h4 className="font-bold text-purple-900">Descuento Especial</h4>
                    <p className="text-sm text-purple-700">Precio fijo específico para un producto</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowTypeModal(false)}
              className="w-full mt-4 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal Descuentos Porcentuales */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowDiscountModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6">
              {editingDiscount ? 'Editar Descuento Porcentual' : 'Nuevo Descuento Porcentual'}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Nombre</label>
                <input
                  type="text"
                  value={discountForm.name}
                  onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                  placeholder="Ej: Black Friday"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Descripción (opcional)</label>
                <input
                  type="text"
                  value={discountForm.description}
                  onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                  placeholder="Detalles de la promoción"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Porcentaje (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={discountForm.percentage}
                    onChange={(e) => setDiscountForm({ ...discountForm, percentage: parseFloat(e.target.value) })}
                    min="0"
                    max="100"
                    className="input flex-1"
                  />
                  <span className="text-lg font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Color del Badge</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={discountForm.color}
                    onChange={(e) => setDiscountForm({ ...discountForm, color: e.target.value })}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <div
                    className="px-4 py-2 rounded-lg text-white font-bold"
                    style={{ backgroundColor: discountForm.color }}
                  >
                    -{discountForm.percentage}%
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowDiscountModal(false)} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button onClick={saveDiscount} disabled={saving} className="btn btn-primary flex-1">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Porcentaje a Productos */}
      {showAssignModal && selectedDiscount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowAssignModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-2">Asignar a Productos</h3>
            <p className="text-sm text-text-muted mb-6">
              {selectedDiscount.name} - {selectedDiscount.percentage}%
            </p>

            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {products.map(product => (
                <label
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-bg rounded-lg cursor-pointer hover:bg-surface transition-colors border border-transparent"
                >
                  <input
                    type="checkbox"
                    checked={productsWithDiscount.includes(product.id)}
                    onChange={() => toggleProductDiscount(product.id)}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-text truncate">{product.name}</div>
                    {product.product_code && (
                      <div className="text-xs text-text-muted">#{product.product_code}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAssignModal(false)} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button
                onClick={saveProductDiscounts}
                disabled={assigningSaving}
                className="btn btn-primary flex-1"
              >
                {assigningSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Descuentos Especiales */}
      {showSpecialModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowSpecialModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6">
              {editingSpecialDiscount ? 'Editar Descuento Especial' : 'Nuevo Descuento Especial'}
            </h3>

            <div className="space-y-4 mb-6">
              {/* Seleccionar Producto */}
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Producto *</label>
                <div className="relative">
                  <button
                    className="w-full p-3 border border-border-light rounded-lg text-left bg-bg hover:border-border transition-colors"
                    onClick={() => {
                      const dropdown = document.getElementById('product-dropdown')
                      if (dropdown) dropdown.classList.toggle('hidden')
                    }}
                  >
                    {selectedProduct ? selectedProduct.name : 'Selecciona un producto'}
                  </button>
                  <div id="product-dropdown" className="hidden absolute top-full left-0 right-0 mt-1 bg-white border border-border-light rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {products.map(product => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product)
                          document.getElementById('product-dropdown')?.classList.add('hidden')
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-200 last:border-0 text-sm"
                      >
                        {product.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Nombre del Descuento *</label>
                <input
                  type="text"
                  value={specialForm.name}
                  onChange={(e) => setSpecialForm({ ...specialForm, name: e.target.value })}
                  placeholder="Ej: Oferta Especial"
                  className="input"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Descripción (opcional)</label>
                <input
                  type="text"
                  value={specialForm.description}
                  onChange={(e) => setSpecialForm({ ...specialForm, description: e.target.value })}
                  placeholder="Detalles de la oferta"
                  className="input"
                />
              </div>

              {/* Precio Original */}
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Precio Original (opcional)</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg">$</span>
                  <input
                    type="number"
                    value={specialForm.original_price}
                    onChange={(e) => setSpecialForm({ ...specialForm, original_price: parseFloat(e.target.value) })}
                    placeholder="0.00"
                    step="0.01"
                    className="input flex-1"
                  />
                </div>
              </div>

              {/* Precio Especial */}
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Precio Especial *</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg">$</span>
                  <input
                    type="number"
                    value={specialForm.fixed_price}
                    onChange={(e) => setSpecialForm({ ...specialForm, fixed_price: parseFloat(e.target.value) })}
                    placeholder="0.00"
                    step="0.01"
                    className="input flex-1"
                  />
                </div>
                {specialForm.original_price > 0 && (
                  <div className="mt-2 text-sm text-green-600 font-semibold">
                    Ahorra: ${(specialForm.original_price - specialForm.fixed_price).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowSpecialModal(false)} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button
                onClick={saveSpecialDiscount}
                disabled={savingSpecial}
                className="btn btn-primary flex-1"
              >
                {savingSpecial ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}