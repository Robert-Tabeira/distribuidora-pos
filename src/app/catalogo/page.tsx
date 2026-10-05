'use client'

import { useState, useEffect, useMemo } from 'react'
import { PublicLayout } from '@/components/public-layout'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Product, Category, Discount } from '@/types/database'
import { getCustomerSession } from '@/lib/customer-auth'
import { Icon } from '@/components/ui/icon'

interface ProductWithDiscount extends Product {
  discount?: Discount
}

// La tabla "categories" ya tiene estas columnas (parent_id, color,
// show_in_catalog), pero el tipo Category en @/types/database todavía
// no las declara. Extendemos el tipo acá mismo en vez de tocar ese
// archivo compartido.
interface CategoryExt extends Category {
  parent_id: string | null
  color: string | null
  show_in_catalog: boolean
}

// Normaliza texto para comparar sin importar tildes/diacríticos
// ("azucar" debe coincidir con "azúcar")
function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isRecentlyAddedProduct(product: Product) {
  const createdAt = new Date(product.created_at).getTime()
  const age = Date.now() - createdAt
  return Number.isFinite(createdAt) && age >= 0 && age < 48 * 60 * 60 * 1000
}

export default function CatalogPage() {
  const [products, setProducts] = useState<ProductWithDiscount[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [landingCategoryTarget, setLandingCategoryTarget] = useState('')
  const [showOnlyDiscounts, setShowOnlyDiscounts] = useState(false)
  const [showOnlyRecentlyAdded, setShowOnlyRecentlyAdded] = useState(false)
  const [cartItems, setCartItems] = useState<{ itemId: string; productId: string; quantity: number; unit: string; notes: string }[]>([])
  const [showCart, setShowCart] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDiscount | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sortOption, setSortOption] = useState<'default' | 'name_asc' | 'name_desc' | 'recent'>('default')
  const [businessPhone, setBusinessPhone] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [savingList, setSavingList] = useState(false)
  const [selectedProductUnit, setSelectedProductUnit] = useState('unidad')
  const [productNotes, setProductNotes] = useState('')
  const [customerOrderingEnabled, setCustomerOrderingEnabled] = useState(false)
  const [showRecentProductBadge, setShowRecentProductBadge] = useState(true)

  useEffect(() => {
    loadData()
    loadCart()
    const params = new URLSearchParams(window.location.search)
    const categoryId = params.get('categoria') || params.get('category')
    if (categoryId) {
      setLandingCategoryTarget(categoryId)
      setSelectedCategories([categoryId])
    }
    supabase.from('website_settings').select('phone_number, customer_orders_enabled, show_recent_product_badge').single().then(({ data }) => {
      if (data?.phone_number) setBusinessPhone(data.phone_number.replace(/\D/g, ''))
      setCustomerOrderingEnabled(data?.customer_orders_enabled === true)
      setShowRecentProductBadge(data?.show_recent_product_badge !== false)
    })
  }, [])

  async function loadData() {
    try {
      const [productsRes, categoriesRes, discountsRes] = await Promise.all([
        supabase.from('products').select('*').eq('status', 'complete').eq('visible_in_catalog', true),
        supabase.from('categories').select('*').order('order_position'),
        supabase.from('discounts').select('*').eq('is_active', true)
      ])

      if (productsRes.data && discountsRes.data) {
        const productsWithDiscounts = await Promise.all(
          productsRes.data.map(async (product) => {
            const { data: productDiscount } = await supabase
              .from('product_discounts')
              .select('discount_id')
              .eq('product_id', product.id)
              .single()

            if (productDiscount?.discount_id) {
              const discount = discountsRes.data.find(d => d.id === productDiscount.discount_id)
              return { ...product, discount }
            }
            return product
          })
        )
        setProducts(productsWithDiscounts)
      }

      if (categoriesRes.data) setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function loadCart() {
    const saved = localStorage.getItem('los_primos_cart')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setCartItems(parsed.map((item, index) => ({
          itemId: item.itemId || `${item.productId}-${item.unit || 'unidad'}-${index}`,
          productId: item.productId,
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'unidad',
          notes: item.notes || ''
        })))
      } catch { localStorage.removeItem('los_primos_cart') }
    }
  }

  function saveCart(items: typeof cartItems) {
    localStorage.setItem('los_primos_cart', JSON.stringify(items))
    setCartItems(items)
  }

  function addToCart(productId: string, unit: string, notes: string) {
    const existing = cartItems.find(item => item.productId === productId && item.unit === unit && item.notes === notes)
    if (existing) {
      saveCart(cartItems.map(item =>
        item.itemId === existing.itemId ? { ...item, quantity: item.quantity + 1 } : item
      ))
    } else {
      saveCart([...cartItems, { itemId: `${productId}-${Date.now()}`, productId, quantity: 1, unit, notes }])
    }
  }

  async function getOrderAccess() {
    const customer = getCustomerSession()
    if (!customer) return { status: 'anonymous' }
    const { data, error } = await supabase.from('customers').select('approval_status').eq('id', customer.id).single()
    if (error) return { status: 'check_failed' }
    return { status: data?.approval_status || 'pending' }
  }

  function showAccessMessage(status: string) {
    setCartMessage(status === 'anonymous'
      ? 'Para realizar pedidos, necesitás registrarte como comercio y esperar la aprobación.'
      : status === 'rejected'
        ? 'La solicitud de este comercio no fue aprobada. Comunicate con Distribuidora Los Primos si necesitás más información.'
        : status === 'check_failed'
          ? 'No pudimos verificar el acceso. Intentá de nuevo más tarde.'
          : 'La solicitud del comercio está pendiente de revisión. La aprobación puede demorar hasta 24 horas.')
    setShowCart(true)
  }

  async function handleAddToCart() {
    const access = await getOrderAccess()
    if (access.status !== 'approved') {
      setSelectedProduct(null)
      showAccessMessage(access.status)
      return
    }
    if (selectedProduct) addToCart(selectedProduct.id, selectedProductUnit, productNotes.trim())
    setCartMessage('Agregado a tu lista de compras')
    setSelectedProduct(null)
    setShowCart(true)
  }

  function removeFromCart(itemId: string) {
    saveCart(cartItems.filter(item => item.itemId !== itemId))
  }

  function updateCartQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      saveCart(cartItems.map(item =>
        item.itemId === itemId ? { ...item, quantity } : item
      ))
    }
  }

  const cartProducts = cartItems.flatMap(item => {
    const product = products.find(p => p.id === item.productId)
    return product ? [{ ...item, product, quantity: item.quantity }] : []
  })

  async function saveShoppingList() {
    const access = await getOrderAccess()
    if (access.status !== 'approved') {
      showAccessMessage(access.status)
      return
    }
    const customer = getCustomerSession()!
    setSavingList(true)
    setCartMessage('')
    const { error } = await supabase.from('customer_shopping_lists').insert({
      customer_id: customer.id,
      items: cartProducts.map(({ product, quantity, unit, notes }) => ({ product_id: product.id, product_name: product.name, quantity, unit, notes }))
    })
    setSavingList(false)
    setCartMessage(error ? 'No pudimos guardar la lista. Revisá la configuración de la base de datos.' : 'Lista guardada en tu cuenta.')
  }

  function sendCartToWhatsApp() {
    const popup = window.open('about:blank', '_blank')
    void (async () => {
      const access = await getOrderAccess()
      if (access.status !== 'approved') {
        popup?.close()
        showAccessMessage(access.status)
        return
      }
      const customer = getCustomerSession()
      const lines = cartProducts.map(({ product, quantity, unit, notes }) => `• ${quantity} ${unit === 'caja' ? (quantity === 1 ? 'caja' : 'cajas') : unit === 'funda' ? (quantity === 1 ? 'funda' : 'fundas') : unit === 'unidad' ? (quantity === 1 ? 'unidad' : 'unidades') : unit} de ${product.name}${notes ? `\n  Nota: ${notes}` : ''}`)
      const message = `Hola, quiero hacer este pedido a nombre de ${customer?.name || ''}${customer?.business_name ? `, del comercio ${customer.business_name}` : ''}:\n\n${lines.join('\n')}`
      const url = `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`
      if (popup) popup.location.href = url
      else window.location.href = url
    })()
  }

  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = normalizeText(searchQuery)
      filtered = filtered.filter(p =>
        normalizeText(p.name).includes(query) ||
        (p.product_code && normalizeText(p.product_code).includes(query)) ||
        (p.description && normalizeText(p.description).includes(query))
      )
    }

    // Usa exactamente la ventana que genera la etiqueta de novedad en la tarjeta.
    if (showOnlyRecentlyAdded) {
      filtered = showRecentProductBadge ? filtered.filter(isRecentlyAddedProduct) : []
    }

    // Filtrar por categorías (matchea tanto si es la categoría principal
    // seleccionada como si es una subcategoría seleccionada)
    if (selectedCategories.length > 0) {
      const catsById = new Map((categories as CategoryExt[]).map(category => [category.id, category]))
      filtered = filtered.filter(p =>
        selectedCategories.some(categoryId =>
          categoryId === p.category_id ||
          categoryId === (p as any).subcategory_id ||
          catsById.get(p.category_id || '')?.parent_id === categoryId
        )
      )
    }

    // Filtrar por descuentos
    if (showOnlyDiscounts) {
      filtered = filtered.filter(p => p.discount)
    }

    // Ordenar
    if (sortOption === 'name_asc') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    } else if (sortOption === 'name_desc') {
      filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name, 'es'))
    } else if (sortOption === 'recent') {
      filtered = [...filtered].sort((a, b) =>
        new Date((b as any).created_at).getTime() - new Date((a as any).created_at).getTime()
      )
    }

    return filtered
  }, [products, categories, searchQuery, selectedCategories, showOnlyDiscounts, showOnlyRecentlyAdded, showRecentProductBadge, sortOption])

  // Agrupa filteredProducts en secciones por categoría (y, dentro de cada
  // una, por subcategoría si corresponde), respetando el orden y color
  // que se definieron en Admin → Categorías.
  const groupedSections = useMemo(() => {
    const cats = categories as CategoryExt[]
    const catsById = new Map(cats.map(c => [c.id, c]))

    // Productos cargados ANTES de que existieran las subcategorías pueden
    // tener category_id apuntando directo a lo que hoy es una subcategoría
    // (en vez de usar category_id=padre + subcategory_id=hijo). Acá lo
    // "traducimos" al vuelo, sin tener que re-editar esos productos.
    function resolveProductCategory(p: ProductWithDiscount) {
      let categoryId = p.category_id
      let subcategoryId = (p as any).subcategory_id || null

      if (categoryId) {
        const catRow = catsById.get(categoryId)
        if (catRow?.parent_id) {
          subcategoryId = subcategoryId || categoryId
          categoryId = catRow.parent_id
        }
      }
      return { categoryId, subcategoryId }
    }

    const mainCategories = cats
      .filter(c => !c.parent_id && c.show_in_catalog !== false)
      .sort((a, b) => a.order_position - b.order_position)

    const sections = mainCategories
      .map(category => {
        const subcategories = cats
          .filter(c => c.parent_id === category.id && c.show_in_catalog !== false)
          .sort((a, b) => a.name.localeCompare(b.name, 'es')) // orden alfabético

        const directProducts = filteredProducts.filter(p => {
          const r = resolveProductCategory(p)
          return r.categoryId === category.id && !r.subcategoryId
        })

        const subGroups = subcategories
          .map(sub => ({
            subcategory: sub,
            products: filteredProducts.filter(p => resolveProductCategory(p).subcategoryId === sub.id)
          }))
          .filter(g => g.products.length > 0)

        return { category, directProducts, subGroups }
      })
      .filter(s => s.directProducts.length > 0 || s.subGroups.length > 0)

    const categorizedIds = new Set(mainCategories.map(c => c.id))
    const uncategorized = filteredProducts.filter(p => {
      const r = resolveProductCategory(p)
      return !r.categoryId || !categorizedIds.has(r.categoryId)
    })

    return { sections, uncategorized }
  }, [filteredProducts, categories])

  useEffect(() => {
    if (!landingCategoryTarget || categories.length === 0) return
    const categoryRows = categories as CategoryExt[]
    const selected = categoryRows.find(category => category.id === landingCategoryTarget)
    if (!selected) {
      setLandingCategoryTarget('')
      return
    }
    const mainCategoryId = selected.parent_id || selected.id
    const categorySection = document.getElementById(`catalog-category-${mainCategoryId}`)
    if (categorySection) {
      categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setLandingCategoryTarget('')
    }
  }, [categories, groupedSections, landingCategoryTarget])

  const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const activeFilterCount = selectedCategories.length + (showOnlyDiscounts ? 1 : 0) + (showOnlyRecentlyAdded ? 1 : 0)

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Card de producto, reutilizada en cada sección/subsección del catálogo
  function renderProductCard(product: ProductWithDiscount) {
    const isRecentlyAdded = showRecentProductBadge && isRecentlyAddedProduct(product)

    return (
      <div
        key={product.id}
        className="relative bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col h-full cursor-pointer group"
        onClick={() => {
          setSelectedProduct(product)
          setActiveImageIndex(0)
          const units = Array.isArray(product.unit) ? product.unit : [product.unit]
          setSelectedProductUnit(units.includes('unidad') ? 'unidad' : units[0] || 'unidad')
          setProductNotes('')
        }}
      >
        {/* Imagen */}
        <div className="relative h-28 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {product.gallery?.[0] ? (
            <img
              src={product.gallery[0]}
              alt={product.name}
              className="w-full h-full object-contain group-hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300"><Icon name="box" className="h-12 w-12" /></div>
          )}
          {product.discount && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-red-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full font-black text-[10px] sm:text-sm shadow-lg">
              -{product.discount.percentage}%
            </div>
          )}
          {isRecentlyAdded && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-emerald-600 text-white px-2 py-1 rounded-full font-bold text-[10px] sm:text-xs shadow-lg">
              Recién agregado
            </div>
          )}
        </div>

        {/* Info - Altura fija */}
        <div className="p-2.5 sm:p-4 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 mb-1 sm:mb-2 flex-1">{product.name}</h3>

          {product.description && (
            <p className="hidden sm:block text-xs text-gray-600 line-clamp-2 mb-2">{product.description}</p>
          )}

          {product.discount && (
            <p className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-red-600 font-semibold"><Icon name="tag" className="h-3.5 w-3.5" />{product.discount.name}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <PublicLayout>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* SIDEBAR FILTROS */}
          <div
            className={`md:block ${
              sidebarOpen ? 'block' : 'hidden'
            } md:col-span-1`}
          >
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg text-gray-900">Filtros</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Limpiar Filtros */}
              {(selectedCategories.length > 0 || showOnlyDiscounts || showOnlyRecentlyAdded || searchQuery.trim()) && (
                <button
                  onClick={() => {
                    setSelectedCategories([])
                    setShowOnlyDiscounts(false)
                    setShowOnlyRecentlyAdded(false)
                    setSearchQuery('')
                  }}
                  className="w-full mb-6 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-semibold"
                >
                  Limpiar Filtros
                </button>
              )}

              {/* Categorías */}
              <div className="mb-8">
                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase">Categorías</h4>
                <div className="space-y-3">
                  {(categories as CategoryExt[])
                    .filter(c => !c.parent_id && c.show_in_catalog !== false)
                    .sort((a, b) => a.order_position - b.order_position)
                    .map(category => (
                      <div key={category.id}>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-900 cursor-pointer"
                          />
                          <span className="text-gray-700 group-hover:text-blue-900 transition-colors text-sm font-semibold">
                            {category.name}
                          </span>
                        </label>

                        {(categories as CategoryExt[])
                          .filter(c => c.parent_id === category.id && c.show_in_catalog !== false)
                          .sort((a, b) => a.order_position - b.order_position)
                          .map(sub => (
                            <label key={sub.id} className="flex items-center gap-3 cursor-pointer group pl-8 mt-2">
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(sub.id)}
                                onChange={() => toggleCategory(sub.id)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-900 cursor-pointer"
                              />
                              <span className="text-gray-600 group-hover:text-blue-900 transition-colors text-sm">
                                {sub.name}
                              </span>
                            </label>
                          ))}
                      </div>
                    ))}
                </div>
              </div>

              {/* Descuentos */}
              <div>
                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase">Ofertas</h4>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showOnlyDiscounts}
                    onChange={(e) => setShowOnlyDiscounts(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-900 cursor-pointer"
                  />
                  <span className="text-gray-700 group-hover:text-blue-900 transition-colors text-sm">
                    Solo con Descuento
                  </span>
                </label>
              </div>

              <div className="mt-8 border-t border-gray-100 pt-6">
                <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase">Novedades</h4>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showOnlyRecentlyAdded}
                    onChange={(e) => setShowOnlyRecentlyAdded(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-900 cursor-pointer"
                  />
                  <span className="inline-flex items-center gap-2 text-gray-700 group-hover:text-blue-900 transition-colors text-sm">
                    <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white">Recién agregado</span>
                  </span>
                </label>
                {!showRecentProductBadge && <p className="mt-2 text-xs text-gray-500">La etiqueta está desactivada en la configuración del sitio.</p>}
              </div>
            </div>
          </div>

          {/* GRID PRODUCTOS */}
          <div className="md:col-span-3">
            {/* Info y Búsqueda */}
            <div className="mb-6">
              <div className="mb-4">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-2xl sm:text-3xl font-black text-gray-900">Productos</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} disponible{filteredProducts.length !== 1 ? 's' : ''}
                </p>
                  </div>
                  {customerOrderingEnabled && <button onClick={() => setShowCart(true)} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 text-white font-bold shadow-sm hover:bg-blue-800"><Icon name="cart" className="h-4 w-4" />Lista ({cartTotal})</button>}
                </div>
              </div>

              {/* Buscador */}
              <div className="relative mb-3">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <input
                  type="text"
                  placeholder="Buscar por nombre, código o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all"
                />

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Fila de controles: filtros (mobile) + orden */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 bg-white active:scale-95 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center bg-blue-900 text-white text-xs rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                  className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="default">Ordenar: relevancia</option>
                  <option value="recent">Fecha de agregado (más nuevos)</option>
                  <option value="name_asc">Nombre (A-Z)</option>
                  <option value="name_desc">Nombre (Z-A)</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <svg className="w-12 h-12 text-blue-900 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <div className="mb-4 text-gray-300"><Icon name="search" className="mx-auto h-12 w-12" /></div>
                <p className="text-lg text-gray-600 font-medium">No se encontraron productos</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchQuery && `No coinciden con: "${searchQuery}"`}
                  {selectedCategories.length > 0 && ` en las categorías seleccionadas`}
                  {showOnlyDiscounts && ` con descuento`}
                  {showOnlyRecentlyAdded && ` con la etiqueta “Recién agregado”`}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategories([])
                    setShowOnlyDiscounts(false)
                    setShowOnlyRecentlyAdded(false)
                  }}
                  className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-all text-sm font-semibold"
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              <div>
                {groupedSections.sections.map(section => (
                  <div id={`catalog-category-${section.category.id}`} key={section.category.id} className="mb-10 scroll-mt-24">
                    <div
                      className="rounded-2xl px-4 py-3 sm:px-5 sm:py-4 mb-4"
                      style={{ backgroundColor: (section.category as any).color || '#f3f4f6' }}
                    >
                      <h2 className="text-lg sm:text-2xl font-black text-gray-900">{section.category.name}</h2>
                    </div>

                    {section.directProducts.length > 0 && (
                      <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 ${section.subGroups.length > 0 ? 'mb-6' : ''}`}>
                        {section.directProducts.map(product => renderProductCard(product))}
                      </div>
                    )}

                    {section.subGroups.map((group, idx) => (
                      <div key={group.subcategory.id} className={idx !== section.subGroups.length - 1 ? 'mb-6' : ''}>
                        <h3
                          className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 pl-3 border-l-4"
                          style={{ borderColor: (group.subcategory as any).color || '#9ca3af' }}
                        >
                          {group.subcategory.name}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                          {group.products.map(product => renderProductCard(product))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {groupedSections.uncategorized.length > 0 && (
                  <div className="mb-10">
                    <div className="rounded-2xl px-4 py-3 sm:px-5 sm:py-4 mb-4 bg-gray-100">
                      <h2 className="text-lg sm:text-2xl font-black text-gray-900">Otros productos</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                      {groupedSections.uncategorized.map(product => renderProductCard(product))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETALLE DE PRODUCTO */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Galería */}
            <div className="relative h-64 sm:h-80 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
              {selectedProduct.gallery && selectedProduct.gallery.length > 0 ? (
                <img
                  src={selectedProduct.gallery[activeImageIndex]}
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><Icon name="box" className="h-20 w-20" /></div>
              )}

              {selectedProduct.discount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-black text-sm shadow-lg">
                  -{selectedProduct.discount.percentage}%
                </div>
              )}

              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Flechas prev/next, solo si hay más de una foto */}
              {selectedProduct.gallery && selectedProduct.gallery.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveImageIndex(i => (i === 0 ? selectedProduct.gallery!.length - 1 : i - 1))
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setActiveImageIndex(i => (i === selectedProduct.gallery!.length - 1 ? 0 : i + 1))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Miniaturas */}
            {selectedProduct.gallery && selectedProduct.gallery.length > 1 && (
              <div className="flex gap-2 px-4 pt-3 overflow-x-auto flex-shrink-0">
                {selectedProduct.gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeImageIndex ? 'border-blue-900' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain bg-gray-50" />
                  </button>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="p-5 overflow-y-auto">
              <h3 className="font-black text-xl text-gray-900 mb-2">{selectedProduct.name}</h3>

              {selectedProduct.description && (
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{selectedProduct.description}</p>
              )}

              {selectedProduct.discount && (
                <p className="mb-4 inline-flex items-center gap-1 text-sm text-red-600 font-semibold"><Icon name="tag" className="h-4 w-4" />{selectedProduct.discount.name}</p>
              )}

              {customerOrderingEnabled && (() => {
                const units = Array.isArray(selectedProduct.unit) ? selectedProduct.unit : [selectedProduct.unit]
                const saleOptions = [...new Set(['unidad', ...(units.includes('caja') ? ['caja'] : []), ...(units.includes('funda') ? ['funda'] : [])])]
                return <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">¿Cómo lo querés?</p>
                  <div className="grid grid-cols-2 gap-2">{saleOptions.map(unit => <button key={unit} onClick={() => setSelectedProductUnit(unit)} className={`py-2.5 px-3 rounded-xl border font-semibold capitalize ${selectedProductUnit === unit ? 'border-blue-900 bg-blue-50 text-blue-900' : 'border-gray-300 text-gray-700'}`}>{unit === 'unidad' ? 'Por unidad' : `Por ${unit}`}</button>)}</div>
                </div>
              })()}
              {customerOrderingEnabled && <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="catalog-product-notes">Anotación para este producto <span className="font-normal text-gray-400">(opcional)</span></label>}
              {customerOrderingEnabled && <textarea id="catalog-product-notes" value={productNotes} onChange={event => setProductNotes(event.target.value)} maxLength={300} rows={3} placeholder="Ej.: sabor, presentación o alguna indicación" className="w-full px-3 py-2 border border-gray-300 rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-blue-900" />}

              {customerOrderingEnabled && <button onClick={handleAddToCart} className="w-full mt-4 py-3 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-800">
                Agregar a la lista
              </button>}
            </div>
          </div>
        </div>
      )}

      {customerOrderingEnabled && showCart && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowCart(false)}>
          <section className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between"><div><h2 className="text-xl font-black">Mi lista de compras</h2><p className="text-sm text-gray-500">{cartTotal} producto{cartTotal !== 1 ? 's' : ''}</p></div><button onClick={() => setShowCart(false)} className="text-2xl text-gray-500" aria-label="Cerrar">×</button></div>
            <div className="p-5 overflow-y-auto flex-1">
              {cartProducts.length === 0 ? <p className="text-center text-gray-500 py-10">Todavía no agregaste productos.</p> : <ul className="divide-y">{cartProducts.map(({ itemId, product, quantity, unit, notes }) => <li key={itemId} className="py-3"><div className="flex items-center gap-3"><div className="flex-1 min-w-0"><p className="font-semibold">{product.name}</p><p className="text-xs text-gray-500 capitalize">Por {unit}</p></div><div className="flex items-center gap-2"><button onClick={() => updateCartQuantity(itemId, quantity - 1)} className="w-8 h-8 rounded-lg border">−</button><span className="w-6 text-center">{quantity}</span><button onClick={() => updateCartQuantity(itemId, quantity + 1)} className="w-8 h-8 rounded-lg border">+</button></div><button onClick={() => removeFromCart(itemId)} className="text-red-600 text-sm ml-2">Quitar</button></div>{notes && <p className="text-sm text-gray-600 mt-2">Nota: {notes}</p>}</li>)}</ul>}
              {cartMessage && <div className="mt-4 text-sm text-blue-900 bg-blue-50 border border-blue-100 rounded-xl p-3"><p>{cartMessage}</p>{cartMessage.includes('registrarte') && <p className="mt-2"><Link href="/cliente/registro" className="font-bold underline">Solicitar acceso</Link>{' · '}<Link href="/cliente/login" className="font-bold underline">Iniciar sesión</Link></p>}{cartMessage.includes('pendiente') && <p className="mt-2"><Link href="/cliente/login" className="font-bold underline">Consultar estado</Link></p>}</div>}
            </div>
            <div className="p-5 border-t space-y-2">
              <button onClick={saveShoppingList} disabled={!cartProducts.length || savingList} className="w-full py-3 rounded-xl border border-blue-900 text-blue-900 font-bold disabled:opacity-50">{savingList ? 'Guardando…' : 'Guardar lista en mi cuenta'}</button>
              <button onClick={sendCartToWhatsApp} disabled={!cartProducts.length} className="w-full py-3 rounded-xl bg-green-600 text-white font-bold disabled:opacity-50">Enviar por WhatsApp</button>
            </div>
          </section>
        </div>
      )}
    </div>
    </PublicLayout>
  )
}
