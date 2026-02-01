'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Category, Product, Employee, CartItem } from '@/types/database'

type CartItemWithCheck = CartItem & { checked: boolean }

export default function MostradorPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItemWithCheck[]>([])
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showCart, setShowCart] = useState(false)
  
  const [modalProduct, setModalProduct] = useState<Product | null>(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [modalWeight, setModalWeight] = useState('')
  const [modalVolume, setModalVolume] = useState('')
  
  // Para cajas/fundas
  const [modalBoxes, setModalBoxes] = useState(1)
  const [modalFraction, setModalFraction] = useState<0 | 0.5 | 0.25>(0)
  const [modalExtraUnits, setModalExtraUnits] = useState(0)
  
  // Para agregar producto nuevo
  const [addingNew, setAddingNew] = useState(false)

  const categoriesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('employee')
    if (!stored) {
      router.push('/login')
      return
    }
    setEmployee(JSON.parse(stored))
    loadData()
    
    // Cargar borrador si existe
    const draft = localStorage.getItem('cartDraft')
    const draftCustomer = localStorage.getItem('cartDraftCustomer')
    if (draft) {
      try {
        setCart(JSON.parse(draft))
      } catch (e) {
        console.error('Error al cargar borrador:', e)
      }
    }
    if (draftCustomer) {
      setCustomerName(draftCustomer)
    }
  }, [router])

  // Guardar borrador automáticamente cuando cambia el carrito
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cartDraft', JSON.stringify(cart))
    } else {
      localStorage.removeItem('cartDraft')
    }
  }, [cart])

  // Guardar nombre del cliente como borrador
  useEffect(() => {
    if (customerName.trim()) {
      localStorage.setItem('cartDraftCustomer', customerName)
    } else {
      localStorage.removeItem('cartDraftCustomer')
    }
  }, [customerName])

  async function loadData() {
    const [categoriesRes, productsRes] = await Promise.all([
      supabase.from('categories').select('*').order('order_position'),
      supabase.from('products').select('*').order('name')
    ])

    if (categoriesRes.data) setCategories(categoriesRes.data)
    if (productsRes.data) setProducts(productsRes.data)
    setLoading(false)
  }

  function logout() {
    localStorage.removeItem('employee')
    localStorage.removeItem('cartDraft')
    localStorage.removeItem('cartDraftCustomer')
    router.push('/login')
  }

  const filteredProducts = products.filter(p => {
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Verificar si hay coincidencia exacta
  const hasExactMatch = products.some(p => 
    p.name.toLowerCase() === searchQuery.toLowerCase().trim()
  )

  function openAddModal(product: Product) {
    setModalProduct(product)
    setModalQuantity(1)
    setModalWeight('')
    setModalVolume('')
    setModalBoxes(1)
    setModalFraction(0)
    setModalExtraUnits(0)
    if (navigator.vibrate) navigator.vibrate(20)
  }

  function closeModal() {
    setModalProduct(null)
  }

  function addToCart() {
    if (!modalProduct) return

    // Generar descripción de caja/funda
    let boxDetail: string | undefined
    if (modalProduct.unit === 'caja' || modalProduct.unit === 'funda') {
      const unitLabel = modalProduct.unit === 'caja' ? 'caja' : 'funda'
      const unitLabelPlural = modalProduct.unit === 'caja' ? 'cajas' : 'fundas'
      
      let parts: string[] = []
      
      // Cajas/fundas enteras + fracción
      const total = modalBoxes + modalFraction
      if (total > 0) {
        if (modalFraction === 0.5) {
          if (modalBoxes === 0) {
            parts.push(`½ ${unitLabel}`)
          } else {
            parts.push(`${modalBoxes} y ½ ${modalBoxes === 1 ? unitLabel : unitLabelPlural}`)
          }
        } else if (modalFraction === 0.25) {
          if (modalBoxes === 0) {
            parts.push(`¼ ${unitLabel}`)
          } else {
            parts.push(`${modalBoxes} y ¼ ${modalBoxes === 1 ? unitLabel : unitLabelPlural}`)
          }
        } else {
          parts.push(`${modalBoxes} ${modalBoxes === 1 ? unitLabel : unitLabelPlural}`)
        }
      }
      
      // Unidades extra
      if (modalExtraUnits > 0) {
        parts.push(`${modalExtraUnits}u`)
      }
      
      boxDetail = parts.join(' + ')
    }

    const newItem: CartItemWithCheck = {
      product: modalProduct,
      quantity: modalQuantity,
      weight: modalWeight ? parseFloat(modalWeight) : undefined,
      volume: modalVolume ? parseFloat(modalVolume) : undefined,
      boxDetail,
      checked: false,
    }

    setCart([...cart, newItem])
    closeModal()
    setSearchQuery('')
    if (navigator.vibrate) navigator.vibrate(50)
  }

  function toggleCheck(index: number) {
    setCart(cart.map((item, i) => 
      i === index ? { ...item, checked: !item.checked } : item
    ))
    if (navigator.vibrate) navigator.vibrate(20)
  }

  function removeFromCart(index: number) {
    setCart(cart.filter((_, i) => i !== index))
  }

  function clearCart() {
    setCart([])
    setCustomerName('')
    setShowCart(false)
    // Limpiar borradores
    localStorage.removeItem('cartDraft')
    localStorage.removeItem('cartDraftCustomer')
  }

  // Agregar producto nuevo a la BD con status pending
  async function quickAddFromSearch() {
    const name = searchQuery.trim()
    if (!name) return

    setAddingNew(true)
    
    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: name,
          unit: 'unidad',
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      // Agregar a la lista local
      setProducts([...products, data])
      
      // Abrir modal para agregar al carrito
      setSearchQuery('')
      openAddModal(data)
      
      if (navigator.vibrate) navigator.vibrate([50, 30, 50])
      
    } catch (error) {
      console.error('Error al crear producto:', error)
      alert('Error al crear el producto')
    } finally {
      setAddingNew(false)
    }
  }

  async function sendToCheckout() {
    if (!employee || !customerName.trim() || cart.length === 0) return

    setSending(true)

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: customerName.trim(),
          employee_id: employee.id,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (orderError) throw orderError

      const items = cart.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        weight: item.weight || null,
        volume: item.volume || null,
        box_detail: item.boxDetail || null,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(items)

      if (itemsError) throw itemsError

      clearCart()
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
      
    } catch (error) {
      console.error('Error al enviar pedido:', error)
      alert('Error al enviar el pedido')
    } finally {
      setSending(false)
    }
  }

  function formatItemDisplay(item: CartItem) {
    if (item.product.unit === 'kg') {
      return `${item.product.name} - ${item.weight || 0}kg`
    }
    if (item.product.unit === 'litro') {
      return `${item.product.name} - ${item.volume || 0}L`
    }
    if ((item.product.unit === 'caja' || item.product.unit === 'funda') && item.boxDetail) {
      return `${item.product.name} - ${item.boxDetail}`
    }
    return `${item.quantity}x ${item.product.name}`
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

  const checkedCount = cart.filter(i => i.checked).length
  const progress = cart.length > 0 ? (checkedCount / cart.length) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="animate-pulse text-text-muted">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg">
      {/* Header con gradiente */}
      <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-zinc-800 text-white sticky top-0 z-20">
        <div className="px-4 pt-safe-top">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="font-bold text-lg">
                  {employee?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Mostrador</h1>
                <p className="text-sm text-white/70">{employee?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {employee?.role === 'admin' && (
                <button 
                  onClick={() => router.push('/admin')}
                  className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
                  title="Volver a Admin"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <button 
                onClick={() => router.push('/reposicion')}
                className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
                title="Reposición"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </button>
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

      {/* Contenido principal */}
      <div className="flex-1 -mt-2 px-4 pb-28 space-y-4">
        {/* Card de cliente */}
        <div className="card p-4 animate-fade-in">
          <label className="text-sm font-semibold text-text-muted mb-2 block">👤 Cliente</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nombre del cliente..."
            className="input"
          />
        </div>

        {/* Búsqueda con opción de agregar nuevo */}
        <div className="animate-fade-in">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar o agregar producto..."
              className="input pl-12 pr-12"
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
          
          {/* Botón agregar nuevo si no hay coincidencia exacta */}
          {searchQuery.trim() && !hasExactMatch && (
            <button
              onClick={quickAddFromSearch}
              disabled={addingNew}
              className="w-full mt-2 p-3 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 text-primary font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {addingNew ? 'Agregando...' : `Agregar "${searchQuery.trim()}"`}
            </button>
          )}
        </div>

        {/* Categorías */}
        <div 
          ref={categoriesRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar py-1 animate-fade-in"
        >
          <button
            onClick={() => setSelectedCategory(null)}
            className={selectedCategory === null ? 'category-chip-active' : 'category-chip-inactive'}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? 'category-chip-active' : 'category-chip-inactive'}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Lista de productos */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="font-medium">
              {searchQuery ? 'Sin resultados' : 'No hay productos'}
            </p>
            {searchQuery && (
              <p className="text-sm mt-1">Podés agregar como nuevo</p>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden animate-fade-in">
            {filteredProducts.map((product, idx) => (
              <div
                key={product.id}
                onClick={() => openAddModal(product)}
                className={`flex items-center gap-4 p-4 active:bg-surface-hover transition-colors cursor-pointer ${
                  idx !== filteredProducts.length - 1 ? 'border-b border-border-light' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-2xl">
                  {getUnitIcon(product.unit)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text truncate flex items-center gap-2">
                    {product.name}
                    {product.status === 'pending' && (
                      <span className="text-xs bg-warning/20 text-amber-700 px-2 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-text-muted">
                    {product.unit === 'kg' && 'Por kilo'}
                    {product.unit === 'litro' && 'Por litro'}
                    {product.unit === 'unidad' && 'Por unidad'}
                    {product.location && ` • ${product.location}`}
                  </div>
                </div>
                <button className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-90 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barra inferior del carrito */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg via-bg to-transparent pt-8 z-20">
        {cart.length === 0 ? (
          <div className="card p-4 text-center">
            <p className="text-text-muted">Agregá productos al pedido</p>
          </div>
        ) : (
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white rounded-2xl p-4 shadow-xl shadow-blue-500/25 active:scale-[0.98] transition-transform"
          >
            <div className="h-1 bg-white/20 rounded-full mb-3 overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="font-bold">{checkedCount}/{cart.length}</span>
                </div>
                <div className="text-left">
                  <div className="font-bold">
                    {checkedCount === cart.length ? '✓ Todo listo' : 'Ver pedido'}
                  </div>
                  <div className="text-sm text-white/70">{customerName || 'Sin nombre'}</div>
                </div>
              </div>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Modal agregar producto */}
      {modalProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={closeModal}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-3xl">
                {getUnitIcon(modalProduct.unit)}
              </div>
              <div>
                <h3 className="font-bold text-xl">{modalProduct.name}</h3>
                <p className="text-text-muted">
                  {modalProduct.unit === 'kg' && 'Se vende por kilo'}
                  {modalProduct.unit === 'litro' && 'Se vende por litro'}
                  {modalProduct.unit === 'unidad' && 'Se vende por unidad'}
                </p>
              </div>
            </div>
            
            {/* Cantidad - solo para productos por unidad */}
            {modalProduct.unit === 'unidad' && (
              <div className="mb-5">
                <label className="block text-sm font-semibold text-text-muted mb-3">Cantidad</label>
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    className="w-14 h-14 rounded-2xl bg-bg flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform"
                  >
                    −
                  </button>
                  <span className="text-5xl font-bold w-20 text-center">{modalQuantity}</span>
                  <button
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    className="w-14 h-14 rounded-2xl bg-bg flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Peso - solo para productos por kilo */}
            {modalProduct.unit === 'kg' && (
              <div className="mb-5">
                <label className="block text-sm font-semibold text-text-muted mb-2">Peso (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  value={modalWeight}
                  onChange={(e) => setModalWeight(e.target.value)}
                  placeholder="Ej: 1.250"
                  className="input text-center text-xl"
                />
              </div>
            )}

            {/* Volumen - solo para productos por litro */}
            {modalProduct.unit === 'litro' && (
              <div className="mb-5">
                <label className="block text-sm font-semibold text-text-muted mb-2">Litros</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={modalVolume}
                  onChange={(e) => setModalVolume(e.target.value)}
                  placeholder="Ej: 10"
                  className="input text-center text-xl"
                />
              </div>
            )}

            {/* Cajas/Fundas */}
            {(modalProduct.unit === 'caja' || modalProduct.unit === 'funda') && (
              <div className="space-y-4">
                {/* Cantidad de cajas/fundas con botones */}
                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-3">
                    {modalProduct.unit === 'caja' ? 'Cajas' : 'Fundas'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3, 4, 5, '½', '¼'].map((val) => (
                      <button
                        key={val}
                        onClick={() => {
                          if (val === '½') {
                            setModalBoxes(0)
                            setModalFraction(0.5)
                          } else if (val === '¼') {
                            setModalBoxes(0)
                            setModalFraction(0.25)
                          } else {
                            setModalBoxes(val as number)
                            setModalFraction(0)
                          }
                        }}
                        className={`py-4 rounded-xl border-2 text-xl font-bold transition-all ${
                          (typeof val === 'number' && modalBoxes === val && modalFraction === 0) ||
                          (val === '½' && modalFraction === 0.5 && modalBoxes === 0) ||
                          (val === '¼' && modalFraction === 0.25 && modalBoxes === 0)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  
                  {/* Combinaciones con fracción */}
                  {modalBoxes > 0 && (
                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-text-muted mb-2">+ Fracción</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 0, label: '0' },
                          { value: 0.5, label: '+ ½' },
                          { value: 0.25, label: '+ ¼' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setModalFraction(opt.value as 0 | 0.5 | 0.25)}
                            className={`py-3 rounded-xl border-2 text-lg font-bold transition-all ${
                              modalFraction === opt.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Unidades extra */}
                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-3">+ Unidades sueltas</label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setModalExtraUnits(Math.max(0, modalExtraUnits - 1))}
                      className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center text-xl font-bold active:scale-90 transition-transform"
                    >
                      −
                    </button>
                    <span className="text-4xl font-bold w-16 text-center">{modalExtraUnits}</span>
                    <button
                      onClick={() => setModalExtraUnits(modalExtraUnits + 1)}
                      className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center text-xl font-bold active:scale-90 transition-transform"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-bg rounded-xl p-4 text-center">
                  <span className="text-text-muted text-sm">Total: </span>
                  <span className="font-bold text-lg text-primary">
                    {(() => {
                      const unitLabel = modalProduct.unit === 'caja' ? 'caja' : 'funda'
                      const unitLabelPlural = modalProduct.unit === 'caja' ? 'cajas' : 'fundas'
                      let parts: string[] = []
                      
                      if (modalBoxes > 0 || modalFraction > 0) {
                        if (modalFraction === 0.5) {
                          if (modalBoxes === 0) parts.push(`½ ${unitLabel}`)
                          else parts.push(`${modalBoxes} y ½ ${unitLabelPlural}`)
                        } else if (modalFraction === 0.25) {
                          if (modalBoxes === 0) parts.push(`¼ ${unitLabel}`)
                          else parts.push(`${modalBoxes} y ¼ ${unitLabelPlural}`)
                        } else {
                          parts.push(`${modalBoxes} ${modalBoxes === 1 ? unitLabel : unitLabelPlural}`)
                        }
                      }
                      
                      if (modalExtraUnits > 0) parts.push(`${modalExtraUnits}u`)
                      
                      return parts.length > 0 ? parts.join(' + ') : 'Selecciona cantidad'
                    })()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button onClick={addToCart} className="btn btn-primary flex-1">
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal del carrito */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowCart(false)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl flex flex-col max-h-[90vh] animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border">
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-2xl">Pedido</h3>
                  <p className="text-text-muted mt-1">
                    {checkedCount} de {cart.length} productos listos
                  </p>
                </div>
                <button onClick={clearCart} className="text-danger font-semibold text-sm">
                  Vaciar
                </button>
              </div>
              {!customerName && (
                <div className="bg-warning/10 text-amber-700 px-4 py-2 rounded-xl mt-4 text-sm font-medium">
                  ⚠️ Falta nombre del cliente
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-3">
                {cart.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => toggleCheck(i)}
                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all active:scale-[0.98] ${
                      item.checked 
                        ? 'bg-success/10 border-2 border-success' 
                        : 'bg-bg border-2 border-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      item.checked 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' 
                        : 'border-2 border-border'
                    }`}>
                      {item.checked && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    
                    <span className={`flex-1 font-medium transition-all ${
                      item.checked ? 'line-through text-text-muted' : 'text-text'
                    }`}>
                      {formatItemDisplay(item)}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromCart(i)
                      }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-text-light hover:text-danger hover:bg-danger/10 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-border">
              <div className="flex gap-3">
                <button onClick={() => setShowCart(false)} className="btn btn-outline flex-1">
                  Seguir
                </button>
                <button
                  onClick={sendToCheckout}
                  disabled={!customerName.trim() || sending}
                  className="btn btn-success flex-1 flex items-center justify-center gap-2"
                >
                  {sending ? 'Enviando...' : (
                    <>
                      Enviar
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
