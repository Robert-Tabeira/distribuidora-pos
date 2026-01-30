'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/database'

type ReposicionItem = {
  id: string
  employee_id: string
  product_id: string
  product_name: string
  quantity: number
  checked: boolean
  created_at: string
}

type EmployeePublic = {
  id: string
  name: string
  role: 'mostrador' | 'caja' | 'admin'
}

export default function ReposicionPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<EmployeePublic | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [items, setItems] = useState<ReposicionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Modal para cantidad
  const [modalProduct, setModalProduct] = useState<Product | null>(null)
  const [modalQuantity, setModalQuantity] = useState(1)

  useEffect(() => {
    const stored = localStorage.getItem('employee')
    if (!stored) {
      router.push('/login')
      return
    }
    const emp = JSON.parse(stored)
    setEmployee(emp)
    loadData(emp.id)
  }, [router])

  async function loadData(employeeId: string) {
    const [productsRes, itemsRes] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('reposicion_items')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
    ])

    if (productsRes.data) setProducts(productsRes.data)
    if (itemsRes.data) setItems(itemsRes.data)
    setLoading(false)
  }

  function logout() {
    localStorage.removeItem('employee')
    router.push('/login')
  }

  // Búsqueda de productos
  const filteredProducts = search.length >= 2
    ? products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : []

  function openAddModal(product: Product) {
    setModalProduct(product)
    setModalQuantity(1)
    setSearch('')
    setShowSearch(false)
  }

  async function addItem() {
    if (!modalProduct || !employee) return

    // Verificar si ya existe en la lista
    const existing = items.find(i => i.product_id === modalProduct.id)
    
    if (existing) {
      // Actualizar cantidad
      const newQty = existing.quantity + modalQuantity
      const { error } = await supabase
        .from('reposicion_items')
        .update({ quantity: newQty, checked: false })
        .eq('id', existing.id)

      if (!error) {
        setItems(items.map(i => 
          i.id === existing.id ? { ...i, quantity: newQty, checked: false } : i
        ))
      }
    } else {
      // Crear nuevo
      const { data, error } = await supabase
        .from('reposicion_items')
        .insert({
          employee_id: employee.id,
          product_id: modalProduct.id,
          product_name: modalProduct.name,
          quantity: modalQuantity,
          checked: false
        })
        .select()
        .single()

      if (!error && data) {
        setItems([data, ...items])
      }
    }

    setModalProduct(null)
    if (navigator.vibrate) navigator.vibrate(50)
  }

  async function toggleChecked(item: ReposicionItem) {
    const newChecked = !item.checked
    const { error } = await supabase
      .from('reposicion_items')
      .update({ checked: newChecked })
      .eq('id', item.id)

    if (!error) {
      setItems(items.map(i => 
        i.id === item.id ? { ...i, checked: newChecked } : i
      ))
      if (navigator.vibrate) navigator.vibrate(30)
    }
  }

  async function deleteItem(id: string) {
    const { error } = await supabase
      .from('reposicion_items')
      .delete()
      .eq('id', id)

    if (!error) {
      setItems(items.filter(i => i.id !== id))
      if (navigator.vibrate) navigator.vibrate(50)
    }
  }

  async function clearChecked() {
    const checkedIds = items.filter(i => i.checked).map(i => i.id)
    if (checkedIds.length === 0) return

    if (!confirm(`¿Eliminar ${checkedIds.length} items marcados?`)) return

    const { error } = await supabase
      .from('reposicion_items')
      .delete()
      .in('id', checkedIds)

    if (!error) {
      setItems(items.filter(i => !i.checked))
      if (navigator.vibrate) navigator.vibrate(100)
    }
  }

  async function clearAll() {
    if (!employee) return
    if (!confirm('¿Borrar toda la lista?')) return

    const { error } = await supabase
      .from('reposicion_items')
      .delete()
      .eq('employee_id', employee.id)

    if (!error) {
      setItems([])
      if (navigator.vibrate) navigator.vibrate(100)
    }
  }

  const uncheckedItems = items.filter(i => !i.checked)
  const checkedItems = items.filter(i => i.checked)

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
      <header className="bg-gradient-to-r from-orange-500 to-amber-500 text-white sticky top-0 z-20">
        <div className="px-4 pt-safe-top">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Reposición</h1>
                <p className="text-sm text-white/70">{employee?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {employee?.role === 'admin' && (
                <button 
                  onClick={() => router.push('/admin')}
                  className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <button 
                onClick={logout} 
                className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Barra de búsqueda */}
      <div className="px-4 -mt-2 mb-4">
        <div className="relative">
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setShowSearch(true)
            }}
            onFocus={() => setShowSearch(true)}
            placeholder="Buscar producto para agregar..."
            className="input pl-12 pr-4"
          />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {search && (
            <button
              onClick={() => {
                setSearch('')
                setShowSearch(false)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover"
            >
              <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Resultados de búsqueda */}
        {showSearch && filteredProducts.length > 0 && (
          <div className="card mt-2 divide-y divide-border max-h-64 overflow-auto">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => openAddModal(product)}
                className="w-full flex items-center gap-3 p-3 hover:bg-surface-hover active:bg-surface-hover transition-colors text-left"
              >
                <span className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-lg">
                  📦
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text truncate">{product.name}</div>
                  <div className="text-sm text-text-muted">
                    {product.unit === 'kg' ? 'Por peso → unidades' : product.unit}
                  </div>
                </div>
                <svg className="w-5 h-5 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex gap-3">
            <div className="flex-1 card p-3 text-center">
              <div className="text-2xl font-bold text-orange-500">{uncheckedItems.length}</div>
              <div className="text-xs text-text-muted">Pendientes</div>
            </div>
            <div className="flex-1 card p-3 text-center">
              <div className="text-2xl font-bold text-success">{checkedItems.length}</div>
              <div className="text-xs text-text-muted">Repuestos</div>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 px-4 pb-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <div className="w-20 h-20 rounded-3xl bg-surface flex items-center justify-center mb-4">
              <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-medium text-lg">Lista vacía</p>
            <p className="text-sm mt-1">Buscá productos para agregar a tu lista</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Items pendientes */}
            {uncheckedItems.length > 0 && (
              <div className="card overflow-hidden">
                {uncheckedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-4 ${
                      idx !== uncheckedItems.length - 1 ? 'border-b border-border-light' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleChecked(item)}
                      className="w-7 h-7 rounded-lg border-2 border-orange-500 flex items-center justify-center active:scale-90 transition-transform"
                    >
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-text">{item.product_name}</div>
                      <div className="text-sm text-text-muted">Cantidad: {item.quantity}</div>
                    </div>
                    <span className="text-2xl font-bold text-orange-500 w-10 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="w-10 h-10 rounded-xl text-danger/60 hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Items completados */}
            {checkedItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-sm font-medium text-text-muted">Repuestos</span>
                  <button
                    onClick={clearChecked}
                    className="text-sm text-danger font-medium"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="card overflow-hidden opacity-60">
                  {checkedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-4 ${
                        idx !== checkedItems.length - 1 ? 'border-b border-border-light' : ''
                      }`}
                    >
                      <button
                        onClick={() => toggleChecked(item)}
                        className="w-7 h-7 rounded-lg bg-success text-white flex items-center justify-center active:scale-90 transition-transform"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-text line-through">{item.product_name}</div>
                      </div>
                      <span className="text-lg font-medium text-text-muted w-10 text-center">
                        {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón limpiar todo */}
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="w-full py-3 text-danger/80 text-sm font-medium"
              >
                Borrar toda la lista
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de cantidad */}
      {modalProduct && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50"
          onClick={() => setModalProduct(null)}
        >
          <div 
            className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            
            <h3 className="font-bold text-xl text-center mb-2">{modalProduct.name}</h3>
            <p className="text-center text-text-muted text-sm mb-6">
              {modalProduct.unit === 'kg' ? 'Unidades enteras (ej: hormas, piezas)' : 'Cantidad'}
            </p>

            {/* Selector de cantidad */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <button
                onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                className="w-16 h-16 rounded-2xl bg-bg flex items-center justify-center text-3xl font-bold active:scale-90 transition-transform"
              >
                −
              </button>
              <span className="text-6xl font-bold w-24 text-center text-orange-500">{modalQuantity}</span>
              <button
                onClick={() => setModalQuantity(modalQuantity + 1)}
                className="w-16 h-16 rounded-2xl bg-bg flex items-center justify-center text-3xl font-bold active:scale-90 transition-transform"
              >
                +
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalProduct(null)}
                className="flex-1 btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={addItem}
                className="flex-1 btn bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
