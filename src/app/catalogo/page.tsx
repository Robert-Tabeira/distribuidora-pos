'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { PublicLayout } from '@/components/public-layout'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Product, Category, Discount } from '@/types/database'
import { getCustomerSession } from '@/lib/customer-auth'
import { Icon } from '@/components/ui/icon'
import { SiteImage } from '@/components/site-image'
import styles from './catalog.module.css'

interface ProductWithDiscount extends Pick<Product, 'id' | 'name' | 'unit' | 'category_id' | 'created_at' | 'gallery' | 'description' | 'product_code'> {
  discount?: Discount
  subcategory_id?: string | null
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

function isRecentlyAddedProduct(product: Pick<Product, 'created_at'>) {
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
  const [urlStateReady, setUrlStateReady] = useState(false)
  const [pendingProductId, setPendingProductId] = useState('')
  const [showOnlyDiscounts, setShowOnlyDiscounts] = useState(false)
  const [showOnlyRecentlyAdded, setShowOnlyRecentlyAdded] = useState(false)
  const [cartItems, setCartItems] = useState<{ itemId: string; productId: string; quantity: number; unit: string; notes: string }[]>([])
  const [showCart, setShowCart] = useState(false)
  const [priceInquiryProductIds, setPriceInquiryProductIds] = useState<string[]>([])
  const [showPriceInquiry, setShowPriceInquiry] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDiscount | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([])
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const filterToggleRef = useRef<HTMLButtonElement>(null)
  const [sortOption, setSortOption] = useState<'default' | 'name_asc' | 'name_desc' | 'recent'>('default')
  const [businessPhone, setBusinessPhone] = useState('')
  const [cartMessage, setCartMessage] = useState('')
  const [savingList, setSavingList] = useState(false)
  const [selectedProductUnit, setSelectedProductUnit] = useState('unidad')
  const [productNotes, setProductNotes] = useState('')
  const [customerOrderingEnabled, setCustomerOrderingEnabled] = useState(false)
  const [showRecentProductBadge, setShowRecentProductBadge] = useState(true)

  useEffect(() => {
    if (!sidebarOpen) return
    const mobile = window.matchMedia('(max-width: 767px)')
    if (!mobile.matches) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    filterPanelRef.current?.focus()
    function closeOnDesktop() {
      if (!mobile.matches) setSidebarOpen(false)
    }
    function handleFilterKeys(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setSidebarOpen(false)
      }
      if (event.key !== 'Tab') return
      const controls = Array.from(filterPanelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href]') || []).filter(element => element.getClientRects().length > 0)
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (!first || !last) return
      if (event.shiftKey && (document.activeElement === first || document.activeElement === filterPanelRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleFilterKeys)
    mobile.addEventListener('change', closeOnDesktop)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleFilterKeys)
      mobile.removeEventListener('change', closeOnDesktop)
      if (filterToggleRef.current?.getClientRects().length) filterToggleRef.current.focus()
    }
  }, [sidebarOpen])

  useEffect(() => {
    loadData()
    loadCart()
    loadPriceInquiry()
    const params = new URLSearchParams(window.location.search)
    const categoryIds = params.getAll('categoria')
    const legacyCategoryId = params.get('category')
    const requestedCategories = categoryIds.length ? categoryIds : legacyCategoryId ? [legacyCategoryId] : []
    if (requestedCategories.length) {
      setLandingCategoryTarget(requestedCategories[0])
      setSelectedCategories(requestedCategories)
    }
    setPendingProductId(params.get('producto') || '')
    setUrlStateReady(true)
    supabase.from('website_settings').select('phone_number, customer_orders_enabled, show_recent_product_badge').single().then(({ data }) => {
      if (data?.phone_number) setBusinessPhone(data.phone_number.replace(/\D/g, ''))
      setCustomerOrderingEnabled(data?.customer_orders_enabled === true)
      setShowRecentProductBadge(data?.show_recent_product_badge !== false)
    })
  }, [])

  useEffect(() => {
    if (!urlStateReady) return
    const url = new URL(window.location.href)
    url.searchParams.delete('categoria')
    url.searchParams.delete('category')
    selectedCategories.forEach(categoryId => url.searchParams.append('categoria', categoryId))
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }, [selectedCategories, urlStateReady])

  useEffect(() => {
    function syncFromBrowserUrl() {
      const params = new URLSearchParams(window.location.search)
      setSelectedCategories(params.getAll('categoria'))
      setPendingProductId(params.get('producto') || '')
      if (!params.has('producto')) setSelectedProduct(null)
    }
    window.addEventListener('popstate', syncFromBrowserUrl)
    return () => window.removeEventListener('popstate', syncFromBrowserUrl)
  }, [])

  useEffect(() => {
    if (!pendingProductId || products.length === 0) return
    const product = products.find(item => item.id === pendingProductId)
    if (product) {
      setSelectedProduct(product)
      setActiveImageIndex(0)
      const units = Array.isArray(product.unit) ? product.unit : [product.unit]
      setSelectedProductUnit(units.includes('unidad') ? 'unidad' : units[0] || 'unidad')
      setPendingProductId('')
    }
  }, [pendingProductId, products])

  async function loadData() {
    try {
      const [productsRes, categoriesRes, discountsRes] = await Promise.all([
        supabase.from('products').select('id,name,unit,category_id,subcategory_id,status,created_at,product_code,gallery,description').eq('status', 'complete').eq('visible_in_catalog', true),
        supabase.from('categories').select('*').order('order_position'),
        supabase.from('discounts').select('*').eq('is_active', true)
      ])

      if (productsRes.data) {
        const productIds = productsRes.data.map(product => product.id)
        const { data: productDiscounts } = productIds.length
          ? await supabase.from('product_discounts').select('product_id,discount_id').in('product_id', productIds)
          : { data: [] }
        const discountById = new Map((discountsRes.data || []).map(discount => [discount.id, discount]))
        const discountByProductId = new Map((productDiscounts || []).map(item => [item.product_id, discountById.get(item.discount_id)]))
        setProducts(productsRes.data.map(product => ({ ...product, discount: discountByProductId.get(product.id) })))
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

  function loadPriceInquiry() {
    const saved = localStorage.getItem('los_primos_price_inquiry')
    if (!saved) return
    try {
      const parsed: unknown = JSON.parse(saved)
      if (Array.isArray(parsed)) setPriceInquiryProductIds(parsed.filter((id): id is string => typeof id === 'string'))
    } catch {
      localStorage.removeItem('los_primos_price_inquiry')
    }
  }

  function savePriceInquiry(productIds: string[]) {
    const uniqueIds = [...new Set(productIds)]
    localStorage.setItem('los_primos_price_inquiry', JSON.stringify(uniqueIds))
    setPriceInquiryProductIds(uniqueIds)
  }

  function addToPriceInquiry(productId: string) {
    savePriceInquiry([...priceInquiryProductIds, productId])
    closeProductDetail()
    setShowPriceInquiry(true)
  }

  function removeFromPriceInquiry(productId: string) {
    savePriceInquiry(priceInquiryProductIds.filter(id => id !== productId))
  }

  const priceInquiryProducts = priceInquiryProductIds.flatMap(productId => {
    const product = products.find(item => item.id === productId)
    return product ? [product] : []
  })

  function sendPriceInquiryToWhatsApp() {
    if (!priceInquiryProducts.length) return
    if (!businessPhone) {
      alert('Todavía no hay un teléfono de WhatsApp configurado para el negocio.')
      return
    }
    const popup = window.open('about:blank', '_blank')
    const lines = priceInquiryProducts.map(product => `• ${product.name}`)
    const message = `Hola, quisiera consultar el precio de estos productos:\n\n${lines.join('\n')}`
    const url = `https://wa.me/${businessPhone}?text=${encodeURIComponent(message)}`
    if (popup) popup.location.href = url
    else window.location.href = url
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
      closeProductDetail()
      showAccessMessage(access.status)
      return
    }
    if (selectedProduct) addToCart(selectedProduct.id, selectedProductUnit, productNotes.trim())
    setCartMessage('Agregado a tu lista de compras')
    closeProductDetail()
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
      let subcategoryId = p.subcategory_id || null

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

  function clearFilters() {
    setSelectedCategories([])
    setShowOnlyDiscounts(false)
    setShowOnlyRecentlyAdded(false)
    setSearchQuery('')
  }

  function closeProductDetail() {
    setSelectedProduct(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('producto')
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }

  function openProductDetail(product: ProductWithDiscount) {
    setSelectedProduct(product)
    setActiveImageIndex(0)
    const units = Array.isArray(product.unit) ? product.unit : [product.unit]
    setSelectedProductUnit(units.includes('unidad') ? 'unidad' : units[0] || 'unidad')
    setProductNotes('')
    const url = new URL(window.location.href)
    url.searchParams.set('producto', product.id)
    window.history.pushState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }

  // Las tarjetas abren el mismo detalle y conservan los enlaces por producto.
  function renderProductCard(product: ProductWithDiscount) {
    const isRecentlyAdded = showRecentProductBadge && isRecentlyAddedProduct(product)
    const inInquiry = priceInquiryProductIds.includes(product.id)

    return (
      <button type="button" key={product.id} className={styles.productCard} onClick={() => openProductDetail(product)} aria-label={`Ver ${product.name}`}>
        <span className={styles.imageWell}>
          {product.gallery?.[0] ? <SiteImage
            src={product.gallery[0]}
            alt=""
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 300px"
            quality={75}
            loading="lazy"
            className="object-contain p-3 sm:p-5"
          /> : <span className="flex h-full items-center justify-center text-[#b9ad97]"><Icon name="box" className="h-12 w-12" /></span>}
          <span className={styles.badges}>
            {product.discount && <span className={styles.discountBadge}>−{product.discount.percentage}%</span>}
            {isRecentlyAdded && <span className={styles.newBadge}>Recién agregado</span>}
          </span>
        </span>
        <span className={styles.productBody}>
          <span className={`${styles.productName} line-clamp-3`}>{product.name}</span>
          {product.description && <span className="mb-2 hidden text-xs leading-relaxed text-[#776c5e] sm:line-clamp-2">{product.description}</span>}
          {product.discount && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#9a5035] sm:text-xs"><Icon name="tag" className="h-3.5 w-3.5 shrink-0" />{product.discount.name}</span>}
          <span className="flex-1" />
          <span className={styles.productFoot}>{inInquiry ? <><span className="inline-flex items-center gap-1"><Icon name="check" className="h-3.5 w-3.5 shrink-0" />En tu consulta</span><span aria-hidden="true">→</span></> : <><span>Ver producto</span><span aria-hidden="true">↗</span></>}</span>
        </span>
      </button>
    )
  }

  return (
    <PublicLayout>
    <div className={styles.catalog}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Ruta de navegación"><Link href="/landing">Inicio</Link><span aria-hidden="true">/</span><span aria-current="page">Catálogo</span></nav>
        <header className={styles.intro}>
          <div><p className={styles.eyebrow}>Los Primos · Por mayor y menor</p><h1 className={styles.title}>Nuestro catálogo</h1><p className={styles.introText}>Encontrá lo que necesitás, armá tu consulta y preguntanos los precios por WhatsApp.</p></div>
          <div className={styles.actions}>
            <button type="button" onClick={() => setShowPriceInquiry(true)} className={styles.primaryButton}><Icon name="document" className="h-4 w-4 shrink-0" />Consulta de precios<span className={styles.count}>{priceInquiryProductIds.length}</span></button>
            {customerOrderingEnabled && <button type="button" onClick={() => setShowCart(true)} className={styles.secondaryButton}><Icon name="cart" className="h-4 w-4 shrink-0" />Mi lista ({cartTotal})</button>}
          </div>
        </header>
        <div className={styles.layout}>
          {/* SIDEBAR FILTROS */}
          <div id="catalog-filters" className={`${styles.sidebarHost} ${sidebarOpen ? styles.sidebarVisible : ''}`}>
            <button type="button" className={styles.filterBackdrop} aria-label="Cerrar panel de filtros" onClick={() => setSidebarOpen(false)} />
            <div ref={filterPanelRef} tabIndex={-1} className={styles.sidebarPanel} role={sidebarOpen ? 'dialog' : 'region'} aria-modal={sidebarOpen || undefined} aria-labelledby="catalog-filters-title">
              <p className={styles.eyebrow}>A tu gusto</p>
              <div className="flex items-center justify-between mb-6">
                <h2 id="catalog-filters-title" className={styles.sidebarTitle}>Explorá por categoría</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Cerrar filtros"
                  className="md:hidden h-11 w-11 shrink-0 flex items-center justify-center rounded-full hover:bg-[#f2ecdf] text-[#817565]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Categorías */}
              <div className="mb-8">
                <h4 className="font-bold text-[#30261d] mb-4 text-sm uppercase">Categorías</h4>
                <div className="space-y-3">
                  {(categories as CategoryExt[])
                    .filter(c => !c.parent_id && c.show_in_catalog !== false)
                    .sort((a, b) => a.order_position - b.order_position)
                    .map(category => {
                      const subcategories = (categories as CategoryExt[])
                        .filter(sub => sub.parent_id === category.id && sub.show_in_catalog !== false)
                        .sort((a, b) => a.order_position - b.order_position)
                      const expanded = expandedCategoryIds.includes(category.id)
                      return <div key={category.id}>
                        <div className="flex items-center gap-1">
                          <label className={`${styles.filterLabel} min-w-0 flex-1 group`}>
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(category.id)}
                              onChange={() => toggleCategory(category.id)}
                              className="w-5 h-5 rounded border-[#d9cdb8] text-[#575b36] cursor-pointer"
                            />
                            <span className="min-w-0 text-[#514738] group-hover:text-[#575b36] transition-colors text-sm font-semibold">{category.name}</span>
                          </label>
                          {subcategories.length > 0 && <button
                            type="button"
                            className={styles.categoryToggle}
                            aria-expanded={expanded}
                            aria-controls={`catalog-subcategories-${category.id}`}
                            aria-label={`${expanded ? 'Ocultar' : 'Mostrar'} subcategorías de ${category.name}`}
                            onClick={() => setExpandedCategoryIds(current => current.includes(category.id) ? current.filter(id => id !== category.id) : [...current, category.id])}
                          >
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                          </button>}
                        </div>
                        {subcategories.length > 0 && <div id={`catalog-subcategories-${category.id}`} hidden={!expanded} className="mt-1 space-y-1">
                          {subcategories.map(sub => <label key={sub.id} className={`${styles.filterLabel} ${styles.filterSublabel} group`}>
                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(sub.id)}
                              onChange={() => toggleCategory(sub.id)}
                              className="w-4 h-4 rounded border-[#d9cdb8] text-[#575b36] cursor-pointer"
                            />
                            <span className="text-[#706556] group-hover:text-[#575b36] transition-colors text-sm">{sub.name}</span>
                          </label>)}
                        </div>}
                      </div>
                    })}
                </div>
              </div>

              {/* Descuentos */}
              <div>
                <h4 className="font-bold text-[#30261d] mb-4 text-sm uppercase">Ofertas</h4>
                <label className={`${styles.filterLabel} group`}>
                  <input
                    type="checkbox"
                    checked={showOnlyDiscounts}
                    onChange={(e) => setShowOnlyDiscounts(e.target.checked)}
                    className="w-5 h-5 rounded border-[#d9cdb8] text-[#575b36] cursor-pointer"
                  />
                  <span className="text-[#514738] group-hover:text-[#575b36] transition-colors text-sm">
                    Solo con Descuento
                  </span>
                </label>
              </div>

              <div className="mt-8 border-t border-[#eee5d7] pt-6">
                <h4 className="font-bold text-[#30261d] mb-4 text-sm uppercase">Novedades</h4>
                <label className={`${styles.filterLabel} group`}>
                  <input
                    type="checkbox"
                    checked={showOnlyRecentlyAdded}
                    onChange={(e) => setShowOnlyRecentlyAdded(e.target.checked)}
                    className="w-5 h-5 rounded border-[#d9cdb8] text-[#575b36] cursor-pointer"
                  />
                  <span className="inline-flex items-center gap-2 text-[#514738] group-hover:text-[#575b36] transition-colors text-sm">
                    <span className="rounded-full bg-[#676d45] px-2 py-1 text-[10px] font-bold text-white">Recién agregado</span>
                  </span>
                </label>
                {!showRecentProductBadge && <p className="mt-2 text-xs text-[#817565]">La etiqueta está desactivada en la configuración del sitio.</p>}
              </div>
              <button type="button" onClick={clearFilters} disabled={activeFilterCount === 0 && !searchQuery.trim()} className={styles.clearFilters}><Icon name="close" className="h-3.5 w-3.5" />Limpiar filtros</button>
            </div>
          </div>

          {/* GRID PRODUCTOS */}
          <div className="min-w-0">
            {/* Info y Búsqueda */}
            <div className={styles.toolbar}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div><h2 className={styles.toolbarTitle}>Elegí tus productos</h2><p className={styles.toolbarHint} role="status">{loading ? 'Cargando catálogo…' : `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`}</p></div>
                <span className="hidden items-center gap-2 text-xs text-[#776c5e] sm:inline-flex"><Icon name="chat" className="h-4 w-4" />Precios por consulta</span>
              </div>

              {/* Buscador */}
              <div className="relative mb-3">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9a8e7d]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <input
                  type="text"
                  aria-label="Buscar productos"
                  placeholder="Buscar por nombre, código o descripción…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 border border-[#d9cdb8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#777b52] focus:border-transparent transition-all"
                />

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9a8e7d] hover:text-[#706556] transition-colors"
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
                  ref={filterToggleRef}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-expanded={sidebarOpen}
                  aria-controls="catalog-filters"
                  className="md:hidden flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border border-[#d9cdb8] rounded-xl font-semibold text-sm text-[#514738] bg-white active:scale-95 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filtros
                  {activeFilterCount > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center bg-[#575b36] text-white text-xs rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <select
                  aria-label="Ordenar productos"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
                  className="flex-1 min-w-0 px-3 py-2.5 border border-[#d9cdb8] rounded-xl text-sm font-semibold text-[#514738] bg-white focus:outline-none focus:ring-2 focus:ring-[#777b52]"
                >
                  <option value="default">Ordenar: relevancia</option>
                  <option value="recent">Fecha de agregado (más nuevos)</option>
                  <option value="name_asc">Nombre (A-Z)</option>
                  <option value="name_desc">Nombre (Z-A)</option>
                </select>
              </div>
              {activeFilterCount > 0 && <div className={styles.chips}>
                {selectedCategories.map(id => {
                  const category = categories.find(item => item.id === id)
                  return category ? <button type="button" key={id} className={styles.chip} onClick={() => toggleCategory(id)} aria-label={`Quitar filtro ${category.name}`}>{category.name}<span aria-hidden="true">×</span></button> : null
                })}
                {showOnlyDiscounts && <button type="button" className={styles.chip} onClick={() => setShowOnlyDiscounts(false)} aria-label="Quitar filtro de ofertas">Con descuento <span aria-hidden="true">×</span></button>}
                {showOnlyRecentlyAdded && <button type="button" className={styles.chip} onClick={() => setShowOnlyRecentlyAdded(false)} aria-label="Quitar filtro de novedades">Recién agregados <span aria-hidden="true">×</span></button>}
              </div>}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <svg className="w-12 h-12 text-[#575b36] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={styles.emptyState}>
                <div className="mb-4 text-[#b9ad97]"><Icon name="search" className="mx-auto h-12 w-12" /></div>
                <p className="text-lg text-[#706556] font-medium">No se encontraron productos</p>
                <p className="text-sm text-[#817565] mt-2">
                  {searchQuery && `No coinciden con: "${searchQuery}"`}
                  {selectedCategories.length > 0 && ` en las categorías seleccionadas`}
                  {showOnlyDiscounts && ` con descuento`}
                  {showOnlyRecentlyAdded && ` con la etiqueta “Recién agregado”`}
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-[#575b36] text-white rounded-lg hover:bg-[#414529] transition-all text-sm font-semibold"
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              <div>
                {groupedSections.sections.map(section => (
                  <div id={`catalog-category-${section.category.id}`} key={section.category.id} className="mb-10 scroll-mt-24">
                    <div className={styles.sectionHeader}>
                      <span className={styles.categoryDot} style={{ backgroundColor: section.category.color || '#777b52' }} aria-hidden="true" />
                      <h2 className={styles.sectionTitle}>{section.category.name}</h2>
                      <span className={styles.sectionCount}>{section.directProducts.length + section.subGroups.reduce((total, group) => total + group.products.length, 0)} productos</span>
                    </div>

                    {section.directProducts.length > 0 && (
                      <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ${section.subGroups.length > 0 ? 'mb-6' : ''}`}>
                        {section.directProducts.map(product => renderProductCard(product))}
                      </div>
                    )}

                    {section.subGroups.map((group, idx) => (
                      <div key={group.subcategory.id} className={idx !== section.subGroups.length - 1 ? 'mb-6' : ''}>
                        <h3
                          className={styles.subcategoryTitle}
                          style={{ borderColor: group.subcategory.color || '#7b7c53' }}
                        >
                          {group.subcategory.name}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {group.products.map(product => renderProductCard(product))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {groupedSections.uncategorized.length > 0 && (
                  <div className="mb-10">
                    <div className={styles.sectionHeader}>
                      <h2 className={styles.sectionTitle}>Otros productos</h2>
                      <span className={styles.sectionCount}>{groupedSections.uncategorized.length} productos</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
          onClick={closeProductDetail}
        >
          <div
            className="bg-[#fffdf8] w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl border border-[#e5dac9] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Galería */}
            <div className="relative h-64 sm:h-80 bg-gradient-to-br from-[#fffdf8] to-[#f3eddf] flex-shrink-0">
              {selectedProduct.gallery && selectedProduct.gallery.length > 0 ? (
                <SiteImage
                  src={selectedProduct.gallery[activeImageIndex]}
                  alt={selectedProduct.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 512px"
                  quality={80}
                  priority
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#b9ad97]"><Icon name="box" className="h-20 w-20" /></div>
              )}

              {selectedProduct.discount && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full font-black text-sm shadow-lg">
                  -{selectedProduct.discount.percentage}%
                </div>
              )}

              <button
                onClick={closeProductDetail}
                aria-label="Cerrar detalle del producto"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
              >
                <svg className="w-5 h-5 text-[#514738]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Flechas prev/next, solo si hay más de una foto */}
              {selectedProduct.gallery && selectedProduct.gallery.length > 1 && (
                <>
                  <button
                    aria-label="Imagen anterior"
                    onClick={() =>
                      setActiveImageIndex(i => (i === 0 ? selectedProduct.gallery!.length - 1 : i - 1))
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 text-[#514738]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    aria-label="Imagen siguiente"
                    onClick={() =>
                      setActiveImageIndex(i => (i === selectedProduct.gallery!.length - 1 ? 0 : i + 1))
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all"
                  >
                    <svg className="w-5 h-5 text-[#514738]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    aria-label={`Ver imagen ${idx + 1}`}
                    aria-pressed={idx === activeImageIndex}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeImageIndex ? 'border-[#73794e]' : 'border-transparent opacity-60'
                    }`}
                  >
                    <SiteImage src={img} alt="" fill sizes="56px" quality={60} loading="lazy" className="object-contain bg-[#f8f4eb]" />
                  </button>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="p-5 overflow-y-auto">
              <h2 className={`${styles.modalTitle} mb-3`}>{selectedProduct.name}</h2>

              {selectedProduct.description && (
                <p className="text-sm text-[#706556] mb-4 leading-relaxed">{selectedProduct.description}</p>
              )}

              {selectedProduct.discount && (
                <p className="mb-4 inline-flex items-center gap-1 text-sm text-red-600 font-semibold"><Icon name="tag" className="h-4 w-4" />{selectedProduct.discount.name}</p>
              )}

              {customerOrderingEnabled && (() => {
                const units = Array.isArray(selectedProduct.unit) ? selectedProduct.unit : [selectedProduct.unit]
                const saleOptions = [...new Set(['unidad', ...(units.includes('caja') ? ['caja'] : []), ...(units.includes('funda') ? ['funda'] : [])])]
                return <div className="mb-4">
                  <p className="text-sm font-semibold text-[#514738] mb-2">¿Cómo lo querés?</p>
                  <div className="grid grid-cols-2 gap-2">{saleOptions.map(unit => <button key={unit} onClick={() => setSelectedProductUnit(unit)} className={`py-2.5 px-3 rounded-xl border font-semibold capitalize ${selectedProductUnit === unit ? 'border-[#73794e] bg-[#eeeedf] text-[#575b36]' : 'border-[#d9cdb8] text-[#514738]'}`}>{unit === 'unidad' ? 'Por unidad' : `Por ${unit}`}</button>)}</div>
                </div>
              })()}
              {customerOrderingEnabled && <label className="block text-sm font-semibold text-[#514738] mb-2" htmlFor="catalog-product-notes">Anotación para este producto <span className="font-normal text-[#9a8e7d]">(opcional)</span></label>}
              {customerOrderingEnabled && <textarea id="catalog-product-notes" value={productNotes} onChange={event => setProductNotes(event.target.value)} maxLength={300} rows={3} placeholder="Ej.: sabor, presentación o alguna indicación" className="w-full px-3 py-2 border border-[#d9cdb8] rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-[#777b52]" />}

              <button onClick={() => addToPriceInquiry(selectedProduct.id)} className={`${styles.primaryButton} mt-4 w-full`}>
                {priceInquiryProductIds.includes(selectedProduct.id) ? 'Ver mi consulta de precios' : 'Agregar a consulta de precios'}
              </button>
              {customerOrderingEnabled && <button onClick={handleAddToCart} className={`${styles.secondaryButton} mt-2 w-full`}>
                Agregar a la lista de compras
              </button>}
            </div>
          </div>
        </div>
      )}

      {customerOrderingEnabled && showCart && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setShowCart(false)}>
          <section className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between"><div><h2 className={styles.modalTitle}>Mi lista de compras</h2><p className="text-sm text-[#817565]">{cartTotal} producto{cartTotal !== 1 ? 's' : ''}</p></div><button onClick={() => setShowCart(false)} className="text-2xl text-[#817565]" aria-label="Cerrar">×</button></div>
            <div className="p-5 overflow-y-auto flex-1">
              {cartProducts.length === 0 ? <p className="text-center text-[#817565] py-10">Todavía no agregaste productos.</p> : <ul className="divide-y">{cartProducts.map(({ itemId, product, quantity, unit, notes }) => <li key={itemId} className="py-3"><div className="flex items-center gap-3"><div className="flex-1 min-w-0"><p className="font-semibold">{product.name}</p><p className="text-xs text-[#817565] capitalize">Por {unit}</p></div><div className="flex items-center gap-2"><button onClick={() => updateCartQuantity(itemId, quantity - 1)} className="w-8 h-8 rounded-lg border">−</button><span className="w-6 text-center">{quantity}</span><button onClick={() => updateCartQuantity(itemId, quantity + 1)} className="w-8 h-8 rounded-lg border">+</button></div><button onClick={() => removeFromCart(itemId)} className="text-red-600 text-sm ml-2">Quitar</button></div>{notes && <p className="text-sm text-[#706556] mt-2">Nota: {notes}</p>}</li>)}</ul>}
              {cartMessage && <div className="mt-4 text-sm text-[#575b36] bg-[#eeeedf] border border-[#d9dcc0] rounded-xl p-3"><p>{cartMessage}</p>{cartMessage.includes('registrarte') && <p className="mt-2"><Link href="/cliente/registro" className="font-bold underline">Solicitar acceso</Link>{' · '}<Link href="/cliente/login" className="font-bold underline">Iniciar sesión</Link></p>}{cartMessage.includes('pendiente') && <p className="mt-2"><Link href="/cliente/login" className="font-bold underline">Consultar estado</Link></p>}</div>}
            </div>
            <div className="p-5 border-t space-y-2">
              <button onClick={saveShoppingList} disabled={!cartProducts.length || savingList} className="w-full py-3 rounded-xl border border-[#73794e] text-[#575b36] font-bold disabled:opacity-50">{savingList ? 'Guardando…' : 'Guardar lista en mi cuenta'}</button>
              <button onClick={sendCartToWhatsApp} disabled={!cartProducts.length} className="w-full py-3 rounded-xl bg-green-600 text-white font-bold disabled:opacity-50">Enviar por WhatsApp</button>
            </div>
          </section>
        </div>
      )}

      {showPriceInquiry && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#1a120d]/65 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setShowPriceInquiry(false)}>
          <section className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-[#e7d9c8] bg-[#fbf7f0] shadow-[0_24px_70px_rgba(20,12,6,0.38)] sm:max-w-xl sm:rounded-3xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-center justify-between bg-[#38251a] px-5 py-5 text-[#fff8ec] sm:px-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d9b98c]">Los Primos · Catálogo</p>
                <h2 className="mt-1 text-2xl font-bold" style={{ fontFamily: "'Lora', Georgia, serif" }}>Consulta de precios</h2>
                <p className="mt-1 text-sm text-[#e9ddcf]">{priceInquiryProducts.length} producto{priceInquiryProducts.length !== 1 ? 's' : ''} en tu lista</p>
              </div>
              <button onClick={() => setShowPriceInquiry(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20" aria-label="Cerrar">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {priceInquiryProducts.length === 0 ? <div className="rounded-2xl border border-dashed border-[#d8c1a3] bg-white/70 px-6 py-12 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2e9e3] text-[#8b4a2f]"><Icon name="tag" className="h-7 w-7" /></span>
                <p className="mt-4 font-bold text-[#3b2a20]">Tu consulta está vacía</p>
                <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#706556]">Abrí un producto del catálogo y elegí “Agregar a consulta de precios” para pedir su cotización.</p>
              </div> : (
                <ul className="space-y-3">
                  {priceInquiryProducts.map(product => <li key={product.id} className="flex items-center gap-3 rounded-2xl border border-[#e7d9c8] bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#eee3d6] bg-[#f8f3ec] sm:h-[72px] sm:w-[72px]">
                      {product.gallery?.[0] ? <SiteImage src={product.gallery[0]} alt={product.name} fill sizes="72px" quality={60} loading="lazy" className="object-contain p-1" /> : <Icon name="box" className="h-8 w-8 text-[#b58b5d]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-bold leading-snug text-[#3b2a20]">{product.name}</p>
                      <p className="mt-1 text-xs font-medium text-[#817565]">Precio a consultar</p>
                    </div>
                    <button onClick={() => removeFromPriceInquiry(product.id)} className="shrink-0 rounded-lg px-2 py-2 text-xs font-bold text-[#8b4a2f] transition hover:bg-[#f6efe5] hover:text-red-700 sm:px-3 sm:text-sm">Quitar</button>
                  </li>)}
                </ul>
              )}
            </div>
            <div className="space-y-3 border-t border-[#e7d9c8] bg-white px-4 py-4 sm:px-6 sm:py-5">
              <button onClick={sendPriceInquiryToWhatsApp} disabled={!priceInquiryProducts.length} className="w-full rounded-xl bg-[#16834d] py-3.5 font-bold text-white shadow-sm transition hover:bg-[#126c40] disabled:cursor-not-allowed disabled:opacity-50">Preguntar precios por WhatsApp</button>
              {priceInquiryProducts.length > 0 && <button onClick={() => savePriceInquiry([])} className="w-full py-1 text-sm font-semibold text-[#817565] transition hover:text-red-600">Vaciar consulta</button>}
            </div>
          </section>
        </div>
      )}
    </div>
    </PublicLayout>
  )
}
