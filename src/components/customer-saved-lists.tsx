'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { SiteImage } from '@/components/site-image'
import { describeBoxContents } from '@/lib/product-packaging'
import { listProductUnits, shoppingListDate, shoppingListTitle, type SavedShoppingList, type ShoppingListItem, type ListCatalogProduct } from '@/lib/customer-shopping-list-types'
import styles from '@/app/cliente/cuenta/account.module.css'

type DraftItem = ShoppingListItem & { key: string }
const serializeItems = (items: ShoppingListItem[]) => items.map(item => ({ product_id: item.product_id, quantity: item.quantity, unit: item.unit ?? 'unidad', notes: item.notes || '' }))

function Thumbnail({ src }: { src?: string | null }) {
  return <span className={styles.productImage}>{src ? <SiteImage src={src} alt="" fill sizes="64px" quality={60} loading="lazy" className="object-contain p-1" /> : <Icon name="box" className="h-5 w-5" />}</span>
}

export function CustomerSavedLists({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [lists, setLists] = useState<SavedShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needsLogin, setNeedsLogin] = useState(false)
  const [page, setPage] = useState(1)
  const [openingId, setOpeningId] = useState('')
  const [activeList, setActiveList] = useState<SavedShoppingList | null>(null)
  const [products, setProducts] = useState<Record<string, ListCatalogProduct>>({})
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftItems, setDraftItems] = useState<DraftItem[]>([])
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SavedShoppingList | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [modalError, setModalError] = useState('')
  const [notice, setNotice] = useState('')
  const [replaceCart, setReplaceCart] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<ListCatalogProduct[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const dialogRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const closeRef = useRef(() => {})
  const sequence = useRef(0)
  const pages = Math.max(1, Math.ceil(lists.length / 6))
  const dirty = Boolean(activeList && (draftName !== (activeList.name || '') || JSON.stringify(serializeItems(draftItems)) !== JSON.stringify(serializeItems(activeList.items))))
  const invalidDraft = !draftItems.length || draftItems.some(item => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 1_000_000 || !products[item.product_id] || !listProductUnits(products[item.product_id]).includes(item.unit ?? 'unidad'))

  const headers = () => ({ 'X-Customer-Id': customerId })
  function resetDraft(list: SavedShoppingList) {
    setDraftName(list.name || '')
    setDraftItems(list.items.map(item => ({ ...item, key: `row-${++sequence.current}` })))
    setSearch('')
    setModalError('')
    setReplaceCart(false)
  }

  async function loadLists() {
    setLoading(true); setError(''); setNeedsLogin(false)
    try {
      const response = await fetch('/api/customer-shopping-lists', { cache: 'no-store', credentials: 'same-origin', headers: headers() })
      const result = await response.json()
      if (!response.ok) { setNeedsLogin(response.status === 401); throw new Error(result.error || 'No pudimos cargar tus listas.') }
      setLists(Array.isArray(result.lists) ? result.lists : [])
      setPage(current => Math.min(current, Math.max(1, Math.ceil((result.lists?.length || 0) / 6))))
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Revisá la conexión e intentá de nuevo.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void loadLists() }, [customerId])
  useEffect(() => { setPage(current => Math.min(current, Math.max(1, Math.ceil(lists.length / 6)))) }, [lists.length])

  function closeDialog() {
    if (saving || deleting) return
    if (deleteTarget) { setDeleteTarget(null); setDeleteError(''); return }
    if (dirty && !window.confirm('Tenés cambios sin guardar. ¿Querés cerrar la lista y descartarlos?')) return
    setActiveList(null); setSearch(''); setReplaceCart(false)
  }
  closeRef.current = closeDialog

  useEffect(() => {
    if (!activeList && !deleteTarget) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    function keyboard(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); return }
      if (event.key !== 'Tab') return
      const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]') || []).filter(element => element.getClientRects().length)
      const first = controls[0], last = controls[controls.length - 1]
      if (!first) { event.preventDefault(); return }
      const outside = !dialogRef.current?.contains(document.activeElement)
      if (event.shiftKey && (outside || document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (outside || document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keyboard)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keyboard); if (previousFocus?.getClientRects().length) previousFocus.focus(); else headingRef.current?.focus() }
  }, [activeList?.id, deleteTarget?.id])

  useEffect(() => {
    setSearchResults([]); setSearchError(''); setSearchLoading(false)
    if (!editing || !activeList || search.trim().length < 2) return
    setSearchLoading(true)
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setSearchLoading(true)
      try {
        const response = await fetch(`/api/customer-shopping-lists?catalog=1&search=${encodeURIComponent(search.trim())}`, { cache: 'no-store', credentials: 'same-origin', headers: headers(), signal: controller.signal })
        const result = await response.json()
        if (!response.ok) { setNeedsLogin(response.status === 401); throw new Error(result.error || 'No pudimos buscar productos.') }
        if (!controller.signal.aborted) setSearchResults(result.products || [])
      } catch (reason) { if (!controller.signal.aborted) setSearchError(reason instanceof Error ? reason.message : 'No pudimos buscar productos.') }
      finally { if (!controller.signal.aborted) setSearchLoading(false) }
    }, 300)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [search, editing, activeList?.id, customerId])

  function writeCart(list: SavedShoppingList) {
    try {
      const items = list.items.map((item, index) => ({ itemId: `${item.product_id}-${Date.now()}-${index}`, productId: item.product_id, quantity: item.quantity, unit: item.unit || 'unidad', notes: item.notes || '' }))
      localStorage.setItem('los_primos_cart', JSON.stringify(items))
      router.push('/catalogo?pedido=1')
    } catch { setModalError('El navegador no permitió guardar el pedido. Habilitá el almacenamiento para repetir tu lista.') }
  }

  function repeatList(list: SavedShoppingList, catalog: Record<string, ListCatalogProduct>) {
    setModalError('')
    if (!list.items.length || list.items.some(item => !catalog[item.product_id] || !listProductUnits(catalog[item.product_id]).includes(item.unit || 'unidad') || !Number.isSafeInteger(item.quantity) || item.quantity < 1)) {
      setModalError('Hay productos o presentaciones que ya no están disponibles. Editá la lista para revisarlos antes de repetir el pedido.')
      return
    }
    try {
      const cart = JSON.parse(localStorage.getItem('los_primos_cart') || '[]')
      if (Array.isArray(cart) && cart.length) { setReplaceCart(true); return }
      writeCart(list)
    } catch { setModalError('No pudimos leer el pedido actual. Revisá el almacenamiento del navegador antes de repetir la lista.') }
  }

  async function openList(list: SavedShoppingList, action: 'view' | 'edit' | 'repeat') {
    setOpeningId(list.id); setError(''); setNotice(''); setNeedsLogin(false)
    try {
      const response = await fetch(`/api/customer-shopping-lists?id=${encodeURIComponent(list.id)}`, { cache: 'no-store', credentials: 'same-origin', headers: headers() })
      const result = await response.json()
      if (!response.ok || !result.list) { setNeedsLogin(response.status === 401); throw new Error(result.error || 'No pudimos abrir la lista.') }
      const currentList: SavedShoppingList = result.list
      const catalog: Record<string, ListCatalogProduct> = Object.fromEntries((result.products as ListCatalogProduct[]).map(product => [product.id, product]))
      setProducts(catalog); setActiveList(currentList); resetDraft(currentList); setEditing(action === 'edit')
      if (action === 'repeat') repeatList(currentList, catalog)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No pudimos abrir la lista.') }
    finally { setOpeningId('') }
  }

  function addProduct(product: ListCatalogProduct) {
    setProducts(current => ({ ...current, [product.id]: product }))
    setDraftItems(current => [...current, { key: `row-${++sequence.current}`, product_id: product.id, product_name: product.name, quantity: 1, unit: '', notes: '', image_url: product.image_url }])
    setSearch(''); setModalError('')
  }

  function updateItem(key: string, changes: Partial<ShoppingListItem>) {
    setDraftItems(current => current.map(item => item.key === key ? { ...item, ...changes } : item))
    setModalError('')
  }

  async function saveChanges() {
    if (!activeList || invalidDraft || saving) return
    setSaving(true); setModalError(''); setNeedsLogin(false)
    try {
      const response = await fetch('/api/customer-shopping-lists', {
        method: 'PATCH', credentials: 'same-origin', headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeList.id, name: draftName, items: serializeItems(draftItems), updated_at: activeList.updated_at }),
      })
      const result = await response.json()
      if (!response.ok || !result.list) { setNeedsLogin(response.status === 401); throw new Error(result.error || 'No pudimos guardar los cambios.') }
      const saved: SavedShoppingList = result.list
      setLists(current => current.map(list => list.id === saved.id ? saved : list))
      setActiveList(saved); resetDraft(saved); setEditing(false); setNotice('Los cambios de tu lista quedaron guardados.')
    } catch (reason) { setModalError(reason instanceof Error ? reason.message : 'No pudimos guardar los cambios. Tu edición se conserva en esta ventana.') }
    finally { setSaving(false) }
  }

  function requestDelete(list: SavedShoppingList) {
    if (saving || deleting || openingId) return
    setDeleteTarget(list); setDeleteError(''); setError(''); setNotice(''); setNeedsLogin(false)
  }

  async function deleteList() {
    if (!deleteTarget || deleting) return
    const target = deleteTarget
    setDeleting(true); setDeleteError(''); setError(''); setNeedsLogin(false)
    try {
      const params = new URLSearchParams({ id: target.id, updated_at: target.updated_at })
      const response = await fetch(`/api/customer-shopping-lists?${params}`, { method: 'DELETE', credentials: 'same-origin', headers: headers() })
      const result = await response.json()
      if (!response.ok || result.deleted_id !== target.id) { setNeedsLogin(response.status === 401); throw new Error(result.error || 'No pudimos borrar la lista. Intentá de nuevo.') }
      setLists(current => current.filter(list => list.id !== target.id))
      if (activeList?.id === target.id) { setActiveList(null); setEditing(false); setSearch(''); setReplaceCart(false) }
      setDeleteTarget(null)
      setNotice(`La lista «${shoppingListTitle(target)}» fue borrada.`)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'No pudimos borrar la lista. Intentá de nuevo.'
      setDeleteError(message); setError(message)
    } finally { setDeleting(false) }
  }

  return <>
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className={styles.eyebrow}>Tus pedidos de siempre</p><h2 ref={headingRef} tabIndex={-1} className={styles.sectionTitle}>Mis listas guardadas</h2><p className={`${styles.muted} mt-2 max-w-xl`}>Guardá tus compras habituales una vez. Después abrí una lista, ajustá lo que necesites y repetí el pedido.</p></div><Link href="/catalogo" className={styles.secondaryButton}><Icon name="cart" className="h-4 w-4" />Ir al catálogo</Link></div>
      {notice && <p role="status" className={`${styles.notice} mb-4`}>{notice}</p>}
      {error && <div role="alert" className={`${styles.notice} ${styles.error} mb-4`}><p>{error}</p>{needsLogin ? <Link href="/cliente/login" className="mt-2 inline-block font-bold underline">Volver a iniciar sesión</Link> : <button onClick={() => void loadLists()} className="mt-2 font-bold underline">Reintentar</button>}</div>}
      {loading ? <p role="status" className={styles.notice}>Cargando tus listas…</p> : !error && !lists.length ? <div className={styles.empty}><span className={styles.profileIcon}><Icon name="document" className="h-6 w-6" /></span><h3 className={`${styles.listTitle} mt-4`}>Tu próximo pedido empieza acá</h3><p className={`${styles.muted} mx-auto mt-2 mb-5 max-w-sm`}>Armá tu pedido en el catálogo y elegí «Guardar lista en mi cuenta». La próxima vez tendrás tus productos listos para repetir.</p><Link href="/catalogo" className={styles.primaryButton}>Armar mi primera lista<Icon name="cart" className="h-4 w-4" /></Link></div> : <div className={styles.listGrid}>{lists.slice((page - 1) * 6, page * 6).map(list => <article key={list.id} className={styles.listCard}>
        <div className="mb-3 flex items-center justify-between gap-3"><span className={styles.profileIcon}><Icon name="document" className="h-5 w-5" /></span><span className="rounded-full bg-[#eeeedf] px-3 py-1 text-xs font-semibold text-[#5c633e]">{list.items.length} artículos</span></div>
        <h3 className={styles.listTitle}>{shoppingListTitle(list)}</h3><p className={`${styles.muted} mt-1`}>Guardada el {shoppingListDate(list.created_at)}</p>
        <div className="my-3">{list.items.slice(0, 3).map((item, index) => <div key={`${item.product_id}-${index}`} className={styles.preview}><Thumbnail src={item.image_url} /><span className={styles.previewName}>{item.quantity} × {item.product_name}</span></div>)}{list.items.length > 3 && <p className={`${styles.muted} mt-2`}>Y {list.items.length - 3} artículos más</p>}</div>
        <div className={styles.listActions}><button onClick={() => void openList(list, 'view')} disabled={Boolean(openingId)} className={styles.secondaryButton}>{openingId === list.id ? 'Abriendo…' : 'Ver y editar'}</button><button onClick={() => void openList(list, 'repeat')} disabled={Boolean(openingId)} className={styles.primaryButton}>Repetir pedido</button></div>
        <button onClick={() => requestDelete(list)} disabled={Boolean(openingId) || deleting} className={`${styles.dangerButton} mt-3 self-start`} aria-label={`Borrar lista ${shoppingListTitle(list)}`}>Borrar lista</button>
      </article>)}</div>}
      {!loading && pages > 1 && <nav aria-label="Páginas de listas" className={styles.pagination}><button className={styles.pageButton} disabled={page === 1} onClick={() => setPage(current => current - 1)}>Anterior</button><span className={`${styles.muted} px-2 py-2`}>{page} de {pages}</span><button className={styles.pageButton} disabled={page >= pages} onClick={() => setPage(current => current + 1)}>Siguiente</button></nav>}
    </section>

    {deleteTarget && <div className={styles.backdrop} onClick={event => { if (event.target === event.currentTarget) closeDialog() }}>
      <section ref={dialogRef} tabIndex={-1} role="alertdialog" aria-modal="true" aria-labelledby="delete-list-heading" aria-describedby="delete-list-description" className={styles.dialog}>
        <header className={styles.dialogHeader}><div><p className={styles.eyebrow}>Mis listas guardadas</p><h2 id="delete-list-heading" className={styles.sectionTitle}>¿Borrar esta lista?</h2></div><button onClick={closeDialog} disabled={deleting} aria-label="Cancelar borrado" className={styles.closeButton}><Icon name="close" className="h-5 w-5" /></button></header>
        <div className={styles.dialogBody}><p className={`${styles.listTitle} mb-3`}>{shoppingListTitle(deleteTarget)}</p><p id="delete-list-description" className={styles.muted}>Se eliminará esta lista guardada de tu cuenta. Esta acción no se puede deshacer. Los artículos de tu carrito actual se conservan.</p>{deleteError && <div role="alert" className={`${styles.notice} ${styles.error} mt-4`}><p>{deleteError}</p>{needsLogin && <Link href="/cliente/login" className="mt-2 inline-block font-bold underline">Volver a iniciar sesión</Link>}</div>}</div>
        <footer className={styles.dialogFooter}><button onClick={closeDialog} disabled={deleting} className={styles.secondaryButton}>Cancelar</button><button onClick={() => void deleteList()} disabled={deleting} className={styles.dangerButton}>{deleting ? 'Borrando…' : 'Sí, borrar lista'}</button></footer>
      </section>
    </div>}

    {activeList && !deleteTarget && <div className={styles.backdrop} onClick={event => { if (event.target === event.currentTarget) closeDialog() }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="saved-list-heading" aria-describedby="saved-list-description" className={styles.dialog}>
        <header className={styles.dialogHeader}><div><p className={styles.eyebrow}>{editing ? 'Personalizá tu próxima compra' : 'Tu lista de compras'}</p><h2 id="saved-list-heading" className={styles.sectionTitle}>{editing ? 'Editar lista' : shoppingListTitle(activeList)}</h2><p id="saved-list-description" className={`${styles.muted} mt-1`}>Repetir carga los productos en «Mi pedido». El envío por WhatsApp lo hacés después de revisarlos.</p></div><button onClick={closeDialog} disabled={saving} aria-label="Cerrar lista" className={styles.closeButton}><Icon name="close" className="h-5 w-5" /></button></header>
        <div className={styles.dialogBody}>
          {modalError && <div role="alert" className={`${styles.notice} ${styles.error} mb-4`}><p>{modalError}</p>{needsLogin && <Link href="/cliente/login" className="mt-2 inline-block font-bold underline">Volver a iniciar sesión</Link>}</div>}
          {notice && !editing && <p role="status" className={`${styles.notice} mb-4`}>{notice}</p>}
          {replaceCart && <div className={`${styles.notice} mb-4`}><p className="font-bold">Ya tenés un pedido en el carrito</p><p className="mt-1">Al continuar, se reemplaza por los artículos de esta lista. Tus listas guardadas se conservan.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => writeCart(activeList)} className={styles.primaryButton}>Reemplazar mi pedido</button><button onClick={() => setReplaceCart(false)} className={styles.secondaryButton}>Conservar el actual</button></div></div>}
          {editing && <div className="mb-6"><label htmlFor="saved-list-name" className={styles.label}>Nombre de la lista</label><input id="saved-list-name" value={draftName} maxLength={80} disabled={saving} onChange={event => setDraftName(event.target.value)} placeholder="Ej.: Pedido de los lunes" className={styles.field} /><p className={`${styles.muted} mt-1`}>Elegí un nombre para reconocerla fácilmente.</p></div>}
          {(editing ? draftItems : activeList.items).map((item, index) => {
            const product = products[item.product_id]
            const unit = item.unit ?? 'unidad'
            const key = editing ? (item as DraftItem).key : `view-${index}`
            const available = product && listProductUnits(product).includes(unit)
            const contents = describeBoxContents({ unit, units_per_box: product?.units_per_box ?? item.units_per_box }, item.quantity)
            return <article key={key} className={styles.item}><div className={styles.itemHeading}><Thumbnail src={product?.image_url || item.image_url} /><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold leading-6">{product?.name || item.product_name}</h3>{!editing && <p className={styles.muted}>{item.quantity} × por {unit}</p>}{contents && unit === 'caja' && <p className="mt-1 text-xs leading-5 text-[#5c633e]">{contents}</p>}{!available && <p className="mt-1 text-xs font-semibold text-[#9a5035]">{!product ? 'Ya no está en el catálogo. Quitalo de la lista para continuar.' : 'Elegí una presentación disponible.'}</p>}</div>{editing && <button disabled={saving} onClick={() => setDraftItems(current => current.filter(row => row.key !== key))} className="min-h-11 px-2 text-xs font-semibold text-[#9a5035]" aria-label={`Quitar ${item.product_name}`}>Quitar</button>}</div>
              {editing ? <><div className={styles.itemControls}><div><label htmlFor={`quantity-${key}`} className={styles.label}>Cantidad</label><input id={`quantity-${key}`} type="number" inputMode="numeric" min={1} max={1_000_000} step={1} value={item.quantity || ''} disabled={saving} className={styles.field} onChange={event => updateItem(key, { quantity: Number(event.target.value) })} /></div><div><label htmlFor={`unit-${key}`} className={styles.label}>Presentación</label><select id={`unit-${key}`} value={unit} disabled={saving || !product} className={styles.field} onChange={event => updateItem(key, { unit: event.target.value })}><option value="">Elegí una opción</option>{product && !listProductUnits(product).includes(unit) && unit && <option value={unit} disabled>Por {unit} (no disponible)</option>}{product && listProductUnits(product).map(option => <option key={option} value={option}>Por {option}{option === 'caja' && product.units_per_box ? ` (${product.units_per_box} unidades)` : ''}</option>)}</select></div></div><label htmlFor={`notes-${key}`} className={`${styles.label} mt-3`}>Anotación <span className="font-normal">(opcional)</span></label><textarea id={`notes-${key}`} rows={2} maxLength={300} value={item.notes || ''} disabled={saving} className={styles.field} onChange={event => updateItem(key, { notes: event.target.value })} /></> : item.notes && <p className={`${styles.muted} mt-2`}>Nota: {item.notes}</p>}
            </article>
          })}
          {editing && <div className="mt-6 rounded-2xl border border-[#e3d7c4] bg-[#f8f3e9] p-4"><label htmlFor="saved-list-search" className={styles.label}>Agregar otro producto</label><input id="saved-list-search" type="search" value={search} maxLength={80} disabled={saving || draftItems.length >= 500} className={styles.field} placeholder="Buscá por nombre, al menos 2 letras" onChange={event => setSearch(event.target.value)} />{searchLoading && <p role="status" className={`${styles.muted} mt-2`}>Buscando productos…</p>}{searchError && <p role="alert" className="mt-2 text-sm text-[#9a5035]">{searchError}</p>}{!searchLoading && !searchError && search.trim().length >= 2 && !searchResults.length && <p className={`${styles.muted} mt-2`}>No hay resultados para esta búsqueda.</p>}{searchResults.length > 0 && <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-[#e3d7c4] bg-white">{searchResults.map(product => <button key={product.id} disabled={saving} onClick={() => addProduct(product)} className={styles.searchResult}><Thumbnail src={product.image_url} /><span className="min-w-0 flex-1">{product.name}</span><span className="font-bold text-[#5c633e]">+ Agregar</span></button>)}</div>}</div>}
          {editing && invalidDraft && <p className={`${styles.muted} mt-4`}>Para guardar, dejá al menos un artículo y revisá que cada uno tenga cantidad y presentación válidas.</p>}
          {!editing && <div className="mt-6 border-t border-[#e3d7c4] pt-4"><button onClick={() => requestDelete(activeList)} className={styles.dangerButton}>Borrar lista guardada</button></div>}
        </div>
        <footer className={styles.dialogFooter}>{editing ? <><button disabled={saving} onClick={() => { if (!dirty || window.confirm('¿Descartar los cambios de esta edición?')) { resetDraft(activeList); setEditing(false) } }} className={styles.secondaryButton}>Cancelar edición</button><button disabled={saving || !dirty || invalidDraft} onClick={() => void saveChanges()} className={styles.primaryButton}>{saving ? 'Guardando…' : 'Guardar cambios'}</button></> : <><button onClick={() => { resetDraft(activeList); setEditing(true); setNotice('') }} className={styles.secondaryButton}><Icon name="edit" className="h-4 w-4" />Editar lista</button><button onClick={() => repeatList(activeList, products)} className={styles.primaryButton}><Icon name="cart" className="h-4 w-4" />Repetir pedido</button></>}</footer>
      </section>
    </div>}
  </>
}
