'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Employee, Discount, Product } from '@/types/database'

export default function DiscountsAdminPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal de crear/editar descuento
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [discountForm, setDiscountForm] = useState({ name: '', description: '', percentage: 0, color: '#FF6B6B' })
  const [saving, setSaving] = useState(false)

  // Modal de asignar descuento a producto
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null)
  const [productsWithDiscount, setProductsWithDiscount] = useState<string[]>([])
  const [assigningSaving, setAssigningSaving] = useState(false)

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
      const [discountsRes, productsRes] = await Promise.all([
        supabase.from('discounts').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('status', 'complete').order('name')
      ])

      if (discountsRes.data) setDiscounts(discountsRes.data)
      if (productsRes.data) setProducts(productsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    router.push('/admin')
  }

  function openNewDiscount() {
    setEditingDiscount(null)
    setDiscountForm({ name: '', description: '', percentage: 0, color: '#FF6B6B' })
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
        // Editar descuento existente
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
        // Crear nuevo descuento
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
    
    // Cargar productos que ya tienen este descuento
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
      // Eliminar todas las asignaciones actuales
      await supabase
        .from('product_discounts')
        .delete()
        .eq('discount_id', selectedDiscount.id)

      // Crear nuevas asignaciones
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

      {/* Contenido */}
      <div className="flex-1 px-4 pb-4">
        {discounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-medium">No hay descuentos creados</p>
            <p className="text-sm mt-1">Crea tu primer descuento</p>
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
        )}
      </div>

      {/* Modal Crear/Editar Descuento */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowDiscountModal(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-6">
              {editingDiscount ? 'Editar Descuento' : 'Nuevo Descuento'}
            </h3>

            <div className="space-y-4 mb-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Nombre</label>
                <input
                  type="text"
                  value={discountForm.name}
                  onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                  placeholder="Ej: Black Friday, Oferta Especial"
                  className="input"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Descripción (opcional)</label>
                <input
                  type="text"
                  value={discountForm.description}
                  onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                  placeholder="Ej: Descuento en productos seleccionados"
                  className="input"
                />
              </div>

              {/* Porcentaje */}
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2">Porcentaje (%)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={discountForm.percentage}
                    onChange={(e) => setDiscountForm({ ...discountForm, percentage: parseFloat(e.target.value) })}
                    min="0"
                    max="100"
                    placeholder="25"
                    className="input flex-1"
                  />
                  <span className="text-lg font-bold">%</span>
                </div>
              </div>

              {/* Color */}
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

      {/* Modal Asignar a Productos */}
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
                  className="flex items-center gap-3 p-3 bg-bg rounded-lg cursor-pointer hover:bg-surface hover:border-border-light transition-colors border border-transparent"
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
                {assigningSaving ? 'Guardando...' : 'Guardar Asignaciones'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
