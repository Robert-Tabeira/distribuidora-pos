'use client'

import { useState, useEffect, useRef } from 'react'
import { useStaffRouter as useRouter } from '@/lib/staff-navigation'
import { supabase } from '@/lib/supabase'
import type { Employee, Product } from '@/types/database'
import { uploadImageToSupabase } from '@/lib/image-upload-helper'
import { MAX_UNITS_PER_BOX, isMissingBoxUnitsColumn, isMissingHalfBoxColumn, isMissingHalfWheelColumn } from '@/lib/product-packaging'
import { productVariants, productVariantsError, isMissingVariantsColumn, MAX_PRODUCT_VARIANTS, MAX_VARIANT_NAME, type ProductVariant } from '@/lib/product-variants'

// Normaliza texto para comparar sin importar tildes/diacríticos
// ("azucar" debe coincidir con "azúcar")
function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function productDeletionErrorMessage(error: unknown) {
  const details = error as { code?: string; message?: string; details?: string }
  if (details?.code === '23503') {
    if (`${details.message || ''} ${details.details || ''}`.includes('order_items')) {
      return 'Este producto figura en pedidos anteriores. Ejecutá la migración 202611050001_preserve_order_items_on_product_delete.sql en Supabase para poder eliminarlo conservando esos pedidos.'
    }
    return 'Este producto está asociado a otros registros y no se pudo eliminar. No se borró ningún dato. Revisá el detalle del error en la consola.'
  }
  return 'No se pudo eliminar el producto. Revisá la conexión y tus permisos e intentá nuevamente.'
}

async function deleteProductRecord(productId: string) {
  // Pedir la fila eliminada evita anunciar éxito cuando una política impide
  // borrar el registro sin devolver un error explícito.
  const { data, error } = await supabase.from('products').delete().eq('id', productId).select('id').maybeSingle()
  if (error) throw error
  if (!data) throw new Error('product_delete_not_confirmed')
}

// Emojis organizados por categoría, estilo selector tipo WhatsApp
const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Tienda y Envíos',
    emojis: ['🏷️', '🔢', '⚖️', '💧', '📦', '🛍️', '🛒', '🎁', '📏', '📐', '🧾', '💰', '💳', '🏪', '🚚', '🧊', '🪝', '🔗', '⭐', '✅']
  },
  {
    label: 'Comida y Bebida',
    emojis: ['🍖', '🍗', '🥓', '🧀', '🥩', '🍞', '🥫', '🥚', '🥛', '🧈', '🍯', '🧂', '🌭', '🍔', '🍕', '🥪', '🍟', '🥗', '🍅', '🥔', '🥕', '🌽', '🍎', '🍌', '🍇', '🍓', '🍾', '🥤', '🧃', '☕', '🍫', '🍬', '🍭']
  },
  {
    label: 'Objetos',
    emojis: ['🧴', '🧻', '🧽', '🪣', '🧺', '🧵', '🪜', '🧱', '🪵', '🔩', '🔧', '🧲', '⛓️', '🔥', '💡', '🔑', '📌', '✂️']
  },
  {
    label: 'Caritas y Símbolos',
    emojis: ['😀', '😊', '👍', '👎', '❤️', '💯', '🎉', '✨', '❌', '⚠️', '❓', '❗', '🔴', '🟢', '🟡', '🔵', '⚪', '⚫']
  }
]

function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-border w-[90vw] max-w-xs max-h-[70vh] overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-sm">Elegí un ícono</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-text-muted">✕</button>
        </div>

        {EMOJI_CATEGORIES.map(cat => (
          <div key={cat.label} className="mb-4">
            <p className="text-[11px] font-bold text-text-muted uppercase mb-2">{cat.label}</p>
            <div className="grid grid-cols-7 gap-1">
              {cat.emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => onSelect(emoji)}
                  className="text-2xl w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 active:scale-90 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProductosPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'complete'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<'name_asc' | 'name_desc' | 'updated_desc' | 'updated_asc'>('updated_desc')

  // Tipos de unidad ("Se vende por"), editables desde una ruedita de config
  const DEFAULT_UNIT_TYPES = [
    { id: 'd1', value: 'unidad', label: 'Unidad', icon: '🔢', order_position: 1 },
    { id: 'd2', value: 'kg', label: 'Kilo', icon: '⚖️', order_position: 2 },
    { id: 'd3', value: 'litro', label: 'Litro', icon: '💧', order_position: 3 },
    { id: 'd4', value: 'caja', label: 'Caja', icon: '📦', order_position: 4 },
    { id: 'd5', value: 'funda', label: 'Funda', icon: '🛍️', order_position: 5 },
    { id: 'd6', value: 'horma', label: 'Horma', icon: '🧀', order_position: 6 }
  ]
  const [unitTypes, setUnitTypes] = useState<{ id: string; value: string; label: string; icon: string; order_position: number }[]>(DEFAULT_UNIT_TYPES)
  const [showUnitTypesModal, setShowUnitTypesModal] = useState(false)
  const [newUnitLabel, setNewUnitLabel] = useState('')
  const [newUnitIcon, setNewUnitIcon] = useState('')
  const [savingUnitType, setSavingUnitType] = useState(false)
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<'new' | string | null>(null)
  
  // Modal de edición
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [creatingProduct, setCreatingProduct] = useState(false)
  const [editName, setEditName] = useState('')
  const [editUnits, setEditUnits] = useState<string[]>(['unidad'])
  const [editUnitsPerBox, setEditUnitsPerBox] = useState('')
  const [editAllowHalfBox, setEditAllowHalfBox] = useState(false)
  const [editAllowHalfWheel, setEditAllowHalfWheel] = useState(false)
  const [editVariants, setEditVariants] = useState<ProductVariant[]>([])
  const variantsError = productVariantsError(editVariants)
  const invalidBoxUnits = editUnits.includes('caja') && editUnitsPerBox.trim() !== '' && (!/^\d+$/.test(editUnitsPerBox.trim()) || Number(editUnitsPerBox) < 1 || Number(editUnitsPerBox) > MAX_UNITS_PER_BOX)
  const editedUnitsPerBox = editUnits.includes('caja') && editUnitsPerBox.trim() !== '' ? Number(editUnitsPerBox) : null
  const [editCategory, setEditCategory] = useState<string | null>(null)
  const [editSubcategory, setEditSubcategory] = useState<string | null>(null)
  const [editLocation, setEditLocation] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editProductCode, setEditProductCode] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const locationSelectorRef = useRef<HTMLDivElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)

  // Imágenes
  const [editGallery, setEditGallery] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Categorías y ubicaciones
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const locationSuggestions = editLocation.trim() ? locations.filter(loc =>
    normalizeText(loc).includes(normalizeText(editLocation)) &&
    normalizeText(loc) !== normalizeText(editLocation)
  ) : []
  const locationSuggestionsVisible = showLocationDropdown && locationSuggestions.length > 0

  // Modal de coincidencias
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [showSimilarModal, setShowSimilarModal] = useState(false)
  const [selectedDuplicateId, setSelectedDuplicateId] = useState<string | null>(null)
  const [resolvingDuplicate, setResolvingDuplicate] = useState(false)

  useEffect(() => {
    if (!showLocationDropdown) return
    // An option may take focus before its click fires. Close only on an
    // actual interaction outside this field, never on an input blur timer.
    const closeOutside = (event: Event) => {
      if (event.target instanceof Node && locationSelectorRef.current && !locationSelectorRef.current.contains(event.target)) {
        setShowLocationDropdown(false)
      }
    }
    document.addEventListener('pointerdown', closeOutside, true)
    document.addEventListener('focusin', closeOutside, true)
    return () => {
      document.removeEventListener('pointerdown', closeOutside, true)
      document.removeEventListener('focusin', closeOutside, true)
    }
  }, [showLocationDropdown])

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
    const [productsRes, categoriesRes, unitTypesRes] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('order_position'),
      supabase.from('unit_types').select('*').order('order_position')
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
    if (unitTypesRes.data && unitTypesRes.data.length > 0) setUnitTypes(unitTypesRes.data)
    setLoading(false)
  }

  function goBack() {
    router.push('/admin')
  }

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sin categoría'
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || 'Sin categoría'
  }

  const getFullCategoryLabel = (product: any) => {
    const main = getCategoryName(product.category_id)
    if (!product.subcategory_id) return main
    const sub = categories.find(c => c.id === product.subcategory_id)
    return sub ? `${main} › ${sub.name}` : main
  }

  // Genera un código automático tipo "Q1", "F2" (letra de la categoría +
  // número secuencial), continuando desde el número más alto ya usado
  // para esa letra, para no pisar códigos existentes.
  function generateProductCode(categoryId: string | null) {
    const cat = categories.find(c => c.id === categoryId)
    const letter = (cat?.name?.trim()?.[0] || 'P').toUpperCase()
    const regex = new RegExp(`^${letter}(\\d+)$`, 'i')
    let max = 0
    products.forEach(p => {
      const m = p.product_code?.match(regex)
      if (m) max = Math.max(max, parseInt(m[1], 10))
    })
    return `${letter}${max + 1}`
  }

  const pendingProducts = products.filter(p => p.status === 'pending')
  const completeProducts = products.filter(p => p.status === 'complete')

  function matchesSearch(product: Product) {
    if (!searchQuery.trim()) return true
    const q = normalizeText(searchQuery.trim())
    return (
      (product.name && normalizeText(product.name).includes(q)) ||
      (product.product_code && normalizeText(product.product_code).includes(q)) ||
      (product.description && normalizeText(product.description).includes(q)) ||
      normalizeText(getCategoryName(product.category_id) || '').includes(q) ||
      (product.location && normalizeText(product.location).includes(q))
    )
  }

  function sortProducts(list: Product[]) {
    const sorted = [...list]
    switch (sortOption) {
      case 'name_asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'))
        break
      case 'name_desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name, 'es'))
        break
      case 'updated_desc':
        sorted.sort((a, b) => {
          const dateB = new Date((b as any).updated_at || b.created_at).getTime()
          const dateA = new Date((a as any).updated_at || a.created_at).getTime()
          return dateB - dateA
        })
        break
      case 'updated_asc':
        sorted.sort((a, b) => {
          const dateB = new Date((b as any).updated_at || b.created_at).getTime()
          const dateA = new Date((a as any).updated_at || a.created_at).getTime()
          return dateA - dateB
        })
        break
    }
    return sorted
  }

  const filteredPendingProducts = sortProducts(pendingProducts.filter(matchesSearch))
  const filteredCompleteProducts = sortProducts(completeProducts.filter(matchesSearch))

  function openEditModal(product: Product) {
    setCreatingProduct(false)
    setEditingProduct(product)
    setEditName(product.name)
    setEditVariants(productVariants(product).map(variant => ({ ...variant })))
    const units = Array.isArray(product.unit) ? product.unit : [product.unit]
    setEditUnits(units.length > 0 ? units : ['unidad'])
    setEditUnitsPerBox(product.units_per_box == null ? '' : String(product.units_per_box))
    setEditAllowHalfBox(product.allow_half_box === true)
    setEditAllowHalfWheel(product.allow_half_wheel === true)
    setEditCategory(product.category_id)
    setEditSubcategory((product as any).subcategory_id || null)
    setEditLocation(product.location || '')
    setEditDescription(product.description || '')
    setEditProductCode(product.product_code || generateProductCode(product.category_id))
    setEditGallery(product.gallery || [])
    setShowLocationDropdown(false)
    setImagePreview(null)
  }

  function openNewProduct() {
    setEditingProduct(null)
    setCreatingProduct(true)
    setEditName('')
    setEditUnits(['unidad'])
    setEditUnitsPerBox('')
    setEditAllowHalfBox(false)
    setEditAllowHalfWheel(false)
    setEditVariants([])
    setEditCategory(null)
    setEditSubcategory(null)
    setEditLocation('')
    setEditDescription('')
    setEditProductCode(generateProductCode(null))
    setEditGallery([])
    setShowLocationDropdown(false)
    setImagePreview(null)
    setShowSimilarModal(false)
    setSimilarProducts([])
    setSelectedDuplicateId(null)
  }

  function closeEditModal() {
    setEditingProduct(null)
    setCreatingProduct(false)
    setShowLocationDropdown(false)
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

  // ===== TIPOS DE UNIDAD ("Se vende por") =====
  async function addUnitType() {
    if (!newUnitLabel.trim()) return
    setSavingUnitType(true)
    try {
      const value = newUnitLabel.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      const maxOrder = unitTypes.length > 0 ? Math.max(...unitTypes.map(u => u.order_position)) : 0

      const { data, error } = await supabase
        .from('unit_types')
        .insert([{ value, label: newUnitLabel.trim(), icon: newUnitIcon.trim() || '🏷️', order_position: maxOrder + 1 }])
        .select()

      if (error) throw error
      if (data) setUnitTypes([...unitTypes, data[0]])
      setNewUnitLabel('')
      setNewUnitIcon('')
    } catch (error) {
      console.error('Error adding unit type:', error)
      alert('❌ Error al agregar. Verificá que la tabla "unit_types" ya exista en Supabase.')
    } finally {
      setSavingUnitType(false)
    }
  }

  async function updateUnitType(id: string, field: 'label' | 'icon', value: string) {
    setUnitTypes(unitTypes.map(u => (u.id === id ? { ...u, [field]: value } : u)))
  }

  async function saveUnitTypeEdit(unit: { id: string; label: string; icon: string }) {
    try {
      const { error } = await supabase
        .from('unit_types')
        .update({ label: unit.label, icon: unit.icon })
        .eq('id', unit.id)
      if (error) throw error
    } catch (error) {
      console.error('Error saving unit type:', error)
      alert('❌ Error al guardar el cambio')
    }
  }

  async function deleteUnitType(id: string) {
    if (!confirm('¿Eliminar esta opción? Los productos que ya la tengan asignada no se modifican.')) return
    try {
      const { error } = await supabase.from('unit_types').delete().eq('id', id)
      if (error) throw error
      setUnitTypes(unitTypes.filter(u => u.id !== id))
    } catch (error) {
      console.error('Error deleting unit type:', error)
      alert('❌ Error al eliminar')
    }
  }

  async function moveUnitType(id: string, direction: 'up' | 'down') {
    const sorted = [...unitTypes].sort((a, b) => a.order_position - b.order_position)
    const idx = sorted.findIndex(u => u.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const current = sorted[idx]
    const swapWith = sorted[swapIdx]

    try {
      await Promise.all([
        supabase.from('unit_types').update({ order_position: swapWith.order_position }).eq('id', current.id),
        supabase.from('unit_types').update({ order_position: current.order_position }).eq('id', swapWith.id)
      ])
      setUnitTypes(unitTypes.map(u => {
        if (u.id === current.id) return { ...u, order_position: swapWith.order_position }
        if (u.id === swapWith.id) return { ...u, order_position: current.order_position }
        return u
      }))
    } catch (error) {
      console.error('Error reordering unit types:', error)
      alert('❌ Error al reordenar')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editingProduct) return

    setUploadingImage(true)

    try {
      const { url, error } = await uploadImageToSupabase(file, editingProduct.id)
      if (error) throw new Error(error)
      if (url) setEditGallery([...editGallery, url])

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
    if ((!editingProduct && !creatingProduct) || saving || resolvingDuplicate || !editName.trim() || editUnits.length === 0) return
    if (invalidBoxUnits) { alert('Las unidades por caja deben ser un número entero mayor a cero.'); return }
    if (variantsError) { alert(variantsError); return }

    const similar = findSimilarProducts(editName.trim(), editingProduct?.id || '')
    
    if (similar.length > 0) {
      setSimilarProducts(similar)
      setSelectedDuplicateId(null)
      setShowSimilarModal(true)
      return
    }

    await performSave()
  }

  async function performSave() {
    if ((!editingProduct && !creatingProduct) || saving || resolvingDuplicate || !editName.trim() || editUnits.length === 0) return
    if (invalidBoxUnits) { alert('Las unidades por caja deben ser un número entero mayor a cero.'); return }
    if (variantsError) { alert(variantsError); return }

    setSaving(true)

    try {
      const newLocation = editLocation.trim() || null
      
      const values = {
        name: editName.trim(),
        unit: editUnits,
        allow_half_box: editUnits.includes('caja') && editAllowHalfBox,
        allow_half_wheel: editUnits.includes('horma') && editAllowHalfWheel,
        ...(editedUnitsPerBox !== null || editingProduct?.units_per_box !== undefined ? { units_per_box: editedUnitsPerBox } : {}),
        category_id: editCategory,
        subcategory_id: editSubcategory,
        location: newLocation,
        description: editDescription.trim() || null,
        product_code: editProductCode.trim() || null,
        gallery: editGallery,
        variants: editVariants.map(variant => ({ ...variant, name: variant.name.trim() })),
        status: 'complete' as const,
      }
      const query = creatingProduct
        ? supabase.from('products').insert({ ...values, visible_in_catalog: true })
        : supabase.from('products').update(values).eq('id', editingProduct!.id)
      const { data, error } = await query.select('*').single()

      if (error) throw error
      if (!data) throw new Error('product_save_not_confirmed')

      const savedProduct = data as Product
      setProducts(current => creatingProduct
        ? [savedProduct, ...current]
        : current.map(product => product.id === savedProduct.id ? savedProduct : product))
      if (creatingProduct) {
        setActiveTab('complete')
        setSearchQuery('')
        setSortOption('updated_desc')
      }

      if (newLocation && !locations.includes(newLocation)) {
        setLocations([...locations, newLocation].sort())
      }

      closeEditModal()
      setShowSimilarModal(false)
      if (navigator.vibrate) navigator.vibrate(50)

    } catch (error) {
      console.error('Error al guardar:', error)
      if (isMissingHalfWheelColumn(error as { code?: string; message?: string })) {
        alert('Primero ejecutá la migración 202611060002_product_half_wheel.sql en Supabase para guardar la opción de media horma.')
        return
      }
      if (isMissingHalfBoxColumn(error as { code?: string; message?: string })) {
        alert('Primero ejecutá la migración 202611060001_product_half_box.sql en Supabase para guardar la opción de media caja.')
        return
      }
      alert(isMissingVariantsColumn(error as { code?: string; message?: string }) ? 'Primero ejecutá la migración 202611010001_product_variants.sql en Supabase para guardar variantes.' : isMissingBoxUnitsColumn(error as { code?: string; message?: string }) ? 'Primero ejecutá la migración 202610250001_product_units_per_box.sql en Supabase para guardar las unidades por caja.' : 'Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  // El usuario marcó que "oldProduct" (ya ingresado) es el mismo que el
  // producto pendiente que está editando. Actualiza el producto viejo con
  // los datos nuevos, y borra el pendiente (ya no hace falta, era el duplicado).
  async function replaceOldWithNew(oldProduct: Product) {
    if (!editingProduct || saving || resolvingDuplicate || !editName.trim() || editUnits.length === 0) return
    if (invalidBoxUnits) { alert('Las unidades por caja deben ser un número entero mayor a cero.'); return }
    if (variantsError) { alert(variantsError); return }

    setResolvingDuplicate(true)
    try {
      const newLocation = editLocation.trim() || null

      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: editName.trim(),
          unit: editUnits,
          allow_half_box: editUnits.includes('caja') && editAllowHalfBox,
          allow_half_wheel: editUnits.includes('horma') && editAllowHalfWheel,
          ...(editedUnitsPerBox !== null || oldProduct.units_per_box !== undefined ? { units_per_box: editedUnitsPerBox } : {}),
          category_id: editCategory,
          subcategory_id: editSubcategory,
          location: newLocation,
          description: editDescription.trim() || null,
          product_code: editProductCode.trim() || null,
          gallery: editGallery,
          variants: editVariants.map(variant => ({ ...variant, name: variant.name.trim() })),
          status: 'complete',
        })
        .eq('id', oldProduct.id)

      if (updateError) throw updateError

      await deleteProductRecord(editingProduct.id)

      setProducts(products
        .filter(p => p.id !== editingProduct.id)
        .map(p =>
          p.id === oldProduct.id
            ? {
                ...p,
                name: editName.trim(),
                unit: editUnits,
                allow_half_box: editUnits.includes('caja') && editAllowHalfBox,
                allow_half_wheel: editUnits.includes('horma') && editAllowHalfWheel,
                ...(editedUnitsPerBox !== null || oldProduct.units_per_box !== undefined ? { units_per_box: editedUnitsPerBox } : {}),
                category_id: editCategory,
                subcategory_id: editSubcategory,
                location: newLocation,
                description: editDescription.trim() || null,
                product_code: editProductCode.trim() || null,
                gallery: editGallery,
                variants: editVariants.map(variant => ({ ...variant, name: variant.name.trim() })),
                status: 'complete' as const
              }
            : p
        )
      )

      if (newLocation && !locations.includes(newLocation)) {
        setLocations([...locations, newLocation].sort())
      }

      closeEditModal()
      setShowSimilarModal(false)
      setSelectedDuplicateId(null)
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (error) {
      console.error('Error al reemplazar:', error)
      if (isMissingHalfWheelColumn(error as { code?: string; message?: string })) {
        alert('Primero ejecutá la migración 202611060002_product_half_wheel.sql en Supabase para guardar la opción de media horma.')
        return
      }
      if (isMissingHalfBoxColumn(error as { code?: string; message?: string })) {
        alert('Primero ejecutá la migración 202611060001_product_half_box.sql en Supabase para guardar la opción de media caja.')
        return
      }
      if ((error as { code?: string })?.code === '23503') {
        alert(productDeletionErrorMessage(error))
        return
      }
      alert(isMissingVariantsColumn(error as { code?: string; message?: string }) ? 'Primero ejecutá la migración 202611010001_product_variants.sql en Supabase para guardar variantes.' : isMissingBoxUnitsColumn(error as { code?: string; message?: string }) ? 'Primero ejecutá la migración 202610250001_product_units_per_box.sql en Supabase para guardar las unidades por caja.' : 'Error al reemplazar el producto')
    } finally {
      setResolvingDuplicate(false)
    }
  }

  // El usuario marcó que hay un duplicado, pero decide quedarse con el
  // producto viejo tal cual está y descartar el pendiente que estaba editando.
  async function discardNewKeepOld() {
    if (saving || resolvingDuplicate) return
    if (creatingProduct) {
      closeEditModal()
      setShowSimilarModal(false)
      setSelectedDuplicateId(null)
      return
    }
    if (!editingProduct) return

    setResolvingDuplicate(true)
    try {
      await deleteProductRecord(editingProduct.id)

      setProducts(products.filter(p => p.id !== editingProduct.id))

      closeEditModal()
      setShowSimilarModal(false)
      setSelectedDuplicateId(null)
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (error) {
      console.error('Error al eliminar el duplicado:', error)
      alert(productDeletionErrorMessage(error))
    } finally {
      setResolvingDuplicate(false)
    }
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`¿Eliminar "${product.name}"? Se quitará del catálogo. Los pedidos anteriores conservarán sus artículos.`)) return

    try {
      await deleteProductRecord(product.id)

      setProducts(current => current.filter(p => p.id !== product.id))
      if (navigator.vibrate) navigator.vibrate(50)

    } catch (error) {
      console.error('Error al eliminar:', error)
      alert(productDeletionErrorMessage(error))
    }
  }

  // Oculta/muestra un producto en el catálogo público, sin borrarlo
  async function toggleCatalogVisibility(product: Product) {
    const willBeVisible = (product as any).visible_in_catalog === false

    try {
      const { error } = await supabase
        .from('products')
        .update({ visible_in_catalog: willBeVisible })
        .eq('id', product.id)

      if (error) throw error

      setProducts(products.map(p =>
        p.id === product.id ? { ...p, visible_in_catalog: willBeVisible } : p
      ))
      if (navigator.vibrate) navigator.vibrate(30)
    } catch (error) {
      console.error('Error al cambiar visibilidad:', error)
      alert('Error al actualizar la visibilidad en el catálogo. Verificá que la columna "visible_in_catalog" ya exista en Supabase.')
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
                <h1 className="font-bold text-lg leading-tight">Productos</h1>
                <p className="text-sm text-white/70">Gestión de productos</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      <div className="px-4 -mt-2 mb-5 flex justify-end">
        <button type="button" onClick={openNewProduct} className="btn btn-primary w-full gap-2 sm:w-auto">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m-7-7h14" /></svg>
          Nuevo producto
        </button>
      </div>

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

      {/* Buscador */}
      <div className="px-4 mb-4">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, código, categoría..."
            className="input w-full !pl-11 !pr-11"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-300"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs font-semibold text-text-muted whitespace-nowrap">Ordenar por:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as typeof sortOption)}
            className="input !py-1.5 !text-sm !w-auto"
          >
            <option value="updated_desc">Modificado: más reciente</option>
            <option value="updated_asc">Modificado: más antiguo</option>
            <option value="name_asc">Nombre (A-Z)</option>
            <option value="name_desc">Nombre (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 pb-4">
        {activeTab === 'pending' ? (
          filteredPendingProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {searchQuery ? (
                <>
                  <p className="font-medium">Sin resultados para "{searchQuery}"</p>
                  <p className="text-sm mt-1">Probá con otro término de búsqueda</p>
                </>
              ) : (
                <>
                  <p className="font-medium">No hay productos pendientes</p>
                  <p className="text-sm mt-1">¡Todo está al día!</p>
                </>
              )}
            </div>
          ) : (
            <div className="card overflow-hidden">
              {filteredPendingProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-4 p-4 ${
                    idx !== filteredPendingProducts.length - 1 ? 'border-b border-border-light' : ''
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
                      title="Editar producto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => router.push(`/productos/${product.id}/imagenes`)}
                      className="w-10 h-10 rounded-xl bg-purple/10 text-purple flex items-center justify-center active:scale-90 transition-transform"
                      title="Editar imágenes"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteProduct(product)}
                      className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center active:scale-90 transition-transform"
                      title="Eliminar producto"
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
          filteredCompleteProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted">
              <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
                <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              {searchQuery ? (
                <>
                  <p className="font-medium">Sin resultados para "{searchQuery}"</p>
                  <p className="text-sm mt-1">Probá con otro término de búsqueda</p>
                </>
              ) : (
                <p className="font-medium">No hay productos</p>
              )}
            </div>
          ) : (
            <div className="card overflow-hidden">
              {filteredCompleteProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className={`flex items-center gap-4 p-4 ${
                    idx !== filteredCompleteProducts.length - 1 ? 'border-b border-border-light' : ''
                  } ${(product as any).visible_in_catalog === false ? 'opacity-50' : ''}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center overflow-hidden p-1">
                    {product.gallery && product.gallery.length > 0 ? (
                      <img
                        src={product.gallery[0]}
                        alt={product.name}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <span className="text-lg">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text truncate">{product.name}</div>
                    <div className="text-sm text-text-muted">
                      {getFullCategoryLabel(product)}
                      {product.location && ` • ${product.location}`}
                      {(product as any).visible_in_catalog === false && (
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 align-middle">OCULTO</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleCatalogVisibility(product)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform ${
                        (product as any).visible_in_catalog === false
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-green-500/10 text-green-600'
                      }`}
                      title={(product as any).visible_in_catalog === false ? 'Mostrar en catálogo' : 'Ocultar del catálogo'}
                    >
                      {(product as any).visible_in_catalog === false ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(product)}
                      className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center active:scale-90 transition-transform"
                      title="Editar producto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => router.push(`/productos/${product.id}/imagenes`)}
                      className="w-10 h-10 rounded-xl bg-purple/10 text-purple flex items-center justify-center active:scale-90 transition-transform"
                      title="Editar imágenes"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteProduct(product)}
                      className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center active:scale-90 transition-transform"
                      title="Eliminar producto"
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
      {(editingProduct || creatingProduct) && !showSimilarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => { if (!saving && !uploadingImage) closeEditModal() }}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            
            <h3 className="font-bold text-xl mb-6">{creatingProduct ? 'Nuevo producto' : 'Editar producto'}</h3>
            {creatingProduct && <p className="-mt-3 mb-5 text-sm text-text-muted">Completá la ficha para agregarlo al catálogo. Después de crearlo, podés cargar sus fotos desde el botón de imágenes.</p>}
            
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
              <label className="block text-sm font-semibold text-text-muted mb-2">Código (se genera automáticamente)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editProductCode}
                  onChange={(e) => setEditProductCode(e.target.value)}
                  placeholder="Ej: Q1"
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={() => setEditProductCode(generateProductCode(editCategory))}
                  title="Generar código automático"
                  className="px-3 rounded-xl border-2 border-border text-text-muted hover:bg-gray-50 font-semibold"
                >
                  🔄
                </button>
              </div>
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

            <fieldset className="mb-4 rounded-xl border border-border p-4">
              <legend className="px-1 text-sm font-semibold text-text-muted">Variantes del producto (opcional)</legend>
              <p className="mb-3 text-xs leading-5 text-text-muted">Ej.: Chocolate blanco, negro y con leche. El cliente elegirá una variante antes de agregar el producto. Comparten las fotos, presentaciones y unidades por caja de esta ficha.</p>
              <div className="space-y-3">{editVariants.map((variant, index) => <div key={variant.id} className="rounded-lg border border-border p-3">
                <label htmlFor={`product-variant-${variant.id}`} className="mb-1 block text-xs font-semibold text-text-muted">Variante {index + 1}</label>
                <input id={`product-variant-${variant.id}`} className="input" maxLength={MAX_VARIANT_NAME} value={variant.name} placeholder="Ej.: Chocolate blanco" onChange={event => setEditVariants(current => current.map(item => item.id === variant.id ? { ...item, name: event.target.value } : item))} />
                <div className="mt-2 flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={variant.is_active} onChange={event => setEditVariants(current => current.map(item => item.id === variant.id ? { ...item, is_active: event.target.checked } : item))} />Disponible en el catálogo</label><button type="button" className="px-2 py-1 text-sm font-semibold text-red-600" onClick={() => setEditVariants(current => current.filter(item => item.id !== variant.id))}>Quitar</button></div>
              </div>)}</div>
              <button type="button" disabled={editVariants.length >= MAX_PRODUCT_VARIANTS} className="mt-3 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary disabled:opacity-50" onClick={() => setEditVariants(current => [...current, { id: crypto.randomUUID(), name: '', is_active: true }])}>+ Agregar variante</button>
              {variantsError && <p role="alert" className="mt-2 text-sm text-red-600">{variantsError}</p>}
              {editVariants.length > 0 && <p className="mt-2 text-xs text-text-muted">Para retirar una opción temporalmente, desactivala. Si todas están desactivadas, el producto no podrá agregarse al pedido ni a la consulta.</p>}
            </fieldset>

            {/* Unidad */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-text-muted">
                  Se vende por <span className="text-text-light font-normal">(podés elegir varias)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowUnitTypesModal(true)}
                  title="Editar opciones"
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-text-muted flex-shrink-0"
                >
                  ⚙️
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[...unitTypes].sort((a, b) => a.order_position - b.order_position).map(opt => (
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

            {editUnits.includes('caja') && <div className="mb-4 rounded-xl border border-border bg-gray-50 p-4">
              <label className="mb-2 flex items-start gap-3 text-sm font-semibold">
                <input type="checkbox" checked={editAllowHalfBox} onChange={event => setEditAllowHalfBox(event.target.checked)} className="mt-1" aria-describedby="product-half-box-help" />
                Permitir pedidos de media caja
              </label>
              <p id="product-half-box-help" className="mb-4 text-xs leading-relaxed text-text-muted">Agrega la opción «Media caja» únicamente para este producto. El cliente debe elegirla al armar su pedido. La cantidad 1 equivale a media caja y la cantidad 2 a dos medias cajas.</p>
              <label htmlFor="product-units-per-box" className="mb-2 block text-sm font-semibold text-text-muted">Unidades por caja cerrada <span className="font-normal">(opcional)</span></label>
              <input id="product-units-per-box" type="number" min={1} max={MAX_UNITS_PER_BOX} step={1} inputMode="numeric" value={editUnitsPerBox} onChange={event => setEditUnitsPerBox(event.target.value)} aria-invalid={invalidBoxUnits} aria-describedby="product-units-per-box-help" placeholder="Ej.: 12" className="input" />
              <p id="product-units-per-box-help" className={`mt-2 text-xs leading-relaxed ${invalidBoxUnits ? 'text-red-600' : 'text-text-muted'}`}>{invalidBoxUnits ? 'Ingresá un número entero mayor a cero.' : 'Cantidad de unidades que contiene una caja completa. Se mostrará en el catálogo y en los pedidos por caja. Dejalo vacío si todavía no tenés el dato.'}</p>
            </div>}

            {editUnits.includes('horma') && <div className="mb-4 rounded-xl border border-border bg-gray-50 p-4">
              <label className="flex items-start gap-3 text-sm font-semibold">
                <input type="checkbox" checked={editAllowHalfWheel} onChange={event => setEditAllowHalfWheel(event.target.checked)} className="mt-1" aria-describedby="product-half-wheel-help" />
                Permitir pedidos de media horma
              </label>
              <p id="product-half-wheel-help" className="mt-2 text-xs leading-relaxed text-text-muted">Al elegir «Por horma», el cliente podrá seleccionar «1 horma» o «1/2 horma». Habilita esta opción únicamente para este producto.</p>
            </div>}

            {/* Categoría */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-muted mb-2">Categoría</label>
              <select
                value={editCategory || ''}
                onChange={(e) => {
                  setEditCategory(e.target.value || null)
                  setEditSubcategory(null) // la subcategoría vieja puede no pertenecer a la nueva categoría
                }}
                className="input"
              >
                <option value="">Sin categoría</option>
                {categories.filter(cat => !cat.parent_id).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Subcategoría (solo si la categoría elegida tiene) */}
            {editCategory && categories.some(c => c.parent_id === editCategory) && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-muted mb-2">
                  Subcategoría <span className="text-text-light font-normal">(opcional)</span>
                </label>
                <select
                  value={editSubcategory || ''}
                  onChange={(e) => setEditSubcategory(e.target.value || null)}
                  className="input"
                >
                  <option value="">Sin subcategoría</option>
                  {categories.filter(cat => cat.parent_id === editCategory).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Ubicación */}
            <div ref={locationSelectorRef} className="mb-4 relative" onKeyDown={event => {
              if (event.key === 'Escape' && showLocationDropdown) {
                event.preventDefault()
                event.stopPropagation()
                locationInputRef.current?.focus()
                setShowLocationDropdown(false)
              }
            }}>
              <label htmlFor="product-location" className="block text-sm font-semibold text-text-muted mb-2">
                Ubicación <span className="text-text-light">(opcional)</span>
              </label>
              <input
                ref={locationInputRef}
                id="product-location"
                type="text"
                value={editLocation}
                onChange={(e) => {
                  setEditLocation(e.target.value)
                  setShowLocationDropdown(true)
                }}
                onFocus={() => setShowLocationDropdown(true)}
                placeholder="Ej: Pasillo 3, Heladera"
                className="input"
                autoComplete="off"
              />
              {locationSuggestionsVisible && (
                <div role="group" aria-label="Ubicaciones sugeridas" className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {locationSuggestions.map(loc => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setEditLocation(loc)
                          locationInputRef.current?.focus()
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

            <div className="flex gap-3">
              <button onClick={closeEditModal} disabled={saving || uploadingImage} className="btn btn-outline flex-1">
                Cancelar
              </button>
              <button 
                onClick={saveProduct} 
                disabled={saving || uploadingImage || !editName.trim() || editUnits.length === 0 || invalidBoxUnits || Boolean(variantsError)}
                className="btn btn-primary flex-1"
              >
                {saving ? 'Guardando...' : creatingProduct ? 'Crear producto' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de productos similares */}
      {showSimilarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
          <div className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl mb-2">¿Es el mismo producto?</h3>
              <p className="text-text-muted">
                Encontramos productos ya ingresados similares a <span className="font-semibold text-text">"{editName}"</span>.
                {' '}Tocá el que se repite, o seguí de largo si ninguno es igual.
              </p>
            </div>

            <div className="space-y-2 mb-6">
              {similarProducts.map(product => {
                const selected = selectedDuplicateId === product.id
                return (
                  <button
                    key={product.id}
                    disabled={saving || resolvingDuplicate}
                    onClick={() => setSelectedDuplicateId(selected ? null : product.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selected ? 'border-primary bg-primary/5' : 'border-border bg-bg'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                        selected ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-text">{product.name}</div>
                        <div className="text-sm text-text-muted mt-1">
                          {getFullCategoryLabel(product)}
                          {product.location && ` • ${product.location}`}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedDuplicateId ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-muted text-center mb-1">
                  Es el mismo producto, ¿qué querés hacer?
                </p>
                <button
                  onClick={() => {
                    const old = similarProducts.find(p => p.id === selectedDuplicateId)
                    if (!old) return
                    if (creatingProduct) {
                      setShowSimilarModal(false)
                      setSelectedDuplicateId(null)
                      openEditModal(old)
                    } else {
                      void replaceOldWithNew(old)
                    }
                  }}
                  disabled={saving || resolvingDuplicate}
                  className="btn btn-primary w-full"
                >
                  {resolvingDuplicate ? 'Aplicando...' : creatingProduct ? 'Editar el producto existente' : '🔄 Reemplazar el anterior con este'}
                </button>
                <button
                  onClick={discardNewKeepOld}
                  disabled={saving || resolvingDuplicate}
                  className="btn btn-outline w-full !text-red-600 !border-red-200 hover:!bg-red-50"
                >
                  {resolvingDuplicate ? 'Eliminando...' : creatingProduct ? 'Descartar el alta y mantener el existente' : '🗑️ Eliminar este nuevo (mantener el anterior)'}
                </button>
                <button
                  disabled={saving || resolvingDuplicate}
                  onClick={() => setSelectedDuplicateId(null)}
                  className="text-sm text-text-muted text-center w-full py-2"
                >
                  Cancelar selección
                </button>
              </div>
            ) : (
              <button 
                onClick={performSave}
                disabled={saving || resolvingDuplicate}
                className="btn btn-primary w-full"
              >
                {saving ? 'Guardando...' : 'Ninguno es igual, continuar guardando'}
              </button>
            )}
            <button type="button" disabled={saving || resolvingDuplicate} onClick={() => { setShowSimilarModal(false); setSelectedDuplicateId(null) }} className="mt-3 w-full py-2 text-sm font-semibold text-text-muted">Volver al formulario</button>
          </div>
        </div>
      )}

      {/* Modal: editar opciones de "Se vende por" */}
      {showUnitTypesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowUnitTypesModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

            <h3 className="font-bold text-xl mb-1">Opciones de "Se vende por"</h3>
            <p className="text-sm text-text-muted mb-6">Agregá, editá o quitá las formas de venta disponibles</p>

            <div className="space-y-2 mb-6">
              {[...unitTypes].sort((a, b) => a.order_position - b.order_position).map((unit, idx, arr) => (
                <div key={unit.id} className="flex items-center gap-2 p-2 rounded-xl border border-border">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveUnitType(unit.id, 'up')}
                      disabled={idx === 0}
                      className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200 text-xs"
                    >▲</button>
                    <button
                      onClick={() => moveUnitType(unit.id, 'down')}
                      disabled={idx === arr.length - 1}
                      className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 hover:bg-gray-200 text-xs"
                    >▼</button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEmojiPickerTarget(unit.id)}
                    className="input !w-14 text-center !py-2 text-xl flex items-center justify-center"
                  >
                    {unit.icon}
                  </button>
                  <input
                    type="text"
                    value={unit.label}
                    onChange={(e) => updateUnitType(unit.id, 'label', e.target.value)}
                    onBlur={() => saveUnitTypeEdit(unit)}
                    className="input flex-1 !py-2"
                  />
                  <button
                    onClick={() => deleteUnitType(unit.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-dashed border-border mb-6">
              <p className="text-xs font-semibold text-text-muted mb-2">AGREGAR NUEVA OPCIÓN</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEmojiPickerTarget('new')}
                  className="input !w-14 text-center !py-2 text-xl flex items-center justify-center"
                >
                  {newUnitIcon || '🏷️'}
                </button>
                <input
                  type="text"
                  value={newUnitLabel}
                  onChange={(e) => setNewUnitLabel(e.target.value)}
                  placeholder="Ej: Docena"
                  className="input flex-1 !py-2"
                />
                <button
                  onClick={addUnitType}
                  disabled={savingUnitType || !newUnitLabel.trim()}
                  className="px-4 rounded-xl bg-primary text-white font-semibold disabled:opacity-50"
                >
                  + Agregar
                </button>
              </div>
            </div>

            <button onClick={() => setShowUnitTypesModal(false)} className="btn btn-primary w-full">
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Selector de emoji tipo WhatsApp */}
      {emojiPickerTarget && (
        <EmojiPicker
          onClose={() => setEmojiPickerTarget(null)}
          onSelect={(emoji) => {
            if (emojiPickerTarget === 'new') {
              setNewUnitIcon(emoji)
            } else {
              const unit = unitTypes.find(u => u.id === emojiPickerTarget)
              updateUnitType(emojiPickerTarget, 'icon', emoji)
              if (unit) saveUnitTypeEdit({ ...unit, icon: emoji })
            }
            setEmojiPickerTarget(null)
          }}
        />
      )}
    </div>
  )
}
