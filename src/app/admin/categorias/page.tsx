'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Category {
  id: string
  name: string
  parent_id: string | null
  color: string | null
  order_position: number
  show_in_catalog: boolean
}

const PRESET_COLORS = [
  '#fee2e2', '#ffedd5', '#fef9c3', '#dcfce7',
  '#dbeafe', '#e0e7ff', '#f3e8ff', '#fce7f3',
  '#f1f5f9', '#e5e7eb'
]

export default function AdminCategoriasPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({
    name: '',
    parent_id: '' as string,
    color: '',
    show_in_catalog: true
  })
  const [saving, setSaving] = useState(false)

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
    setAdmin(emp)
    loadCategories()
  }, [router])

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('order_position')
    if (data) setCategories(data as Category[])
    setLoading(false)
  }

  const mainCategories = categories
    .filter(c => !c.parent_id)
    .sort((a, b) => a.order_position - b.order_position)

  const getSubcategories = (parentId: string) =>
    categories
      .filter(c => c.parent_id === parentId)
      .sort((a, b) => a.order_position - b.order_position)

  function openModal(category?: Category, presetParentId?: string) {
    if (category) {
      setEditing(category)
      setForm({
        name: category.name,
        parent_id: category.parent_id || '',
        color: category.color || '',
        show_in_catalog: category.show_in_catalog !== false
      })
    } else {
      setEditing(null)
      setForm({ name: '', parent_id: presetParentId || '', color: '', show_in_catalog: true })
    }
    setShowModal(true)
  }

  async function save() {
    if (!form.name.trim()) {
      alert('⚠️ El nombre es obligatorio')
      return
    }

    // Evita que una categoría se vuelva subcategoría de sí misma
    if (editing && form.parent_id === editing.id) {
      alert('⚠️ Una categoría no puede ser subcategoría de sí misma')
      return
    }

    // Evita 3 niveles: si tiene subcategorías, no puede volverse subcategoría
    if (editing && form.parent_id && getSubcategories(editing.id).length > 0) {
      alert('⚠️ Esta categoría tiene subcategorías, así que no puede volverse subcategoría de otra. Movelas primero.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        parent_id: form.parent_id || null,
        color: form.color || null,
        show_in_catalog: form.show_in_catalog
      }

      if (editing) {
        const { error } = await supabase.from('categories').update(payload).eq('id', editing.id)
        if (error) throw error
        setCategories(categories.map(c => (c.id === editing.id ? { ...c, ...payload } : c)))
      } else {
        const siblings = form.parent_id ? getSubcategories(form.parent_id) : mainCategories
        const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(c => c.order_position)) : 0

        const { data, error } = await supabase
          .from('categories')
          .insert([{ ...payload, order_position: maxOrder + 1 }])
          .select()

        if (error) throw error
        if (data) setCategories([...categories, data[0] as Category])
      }

      setShowModal(false)
    } catch (error) {
      console.error('Error al guardar categoría:', error)
      alert('❌ Error al guardar. Verificá que las columnas nuevas ya existan en Supabase.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(category: Category) {
    const subs = getSubcategories(category.id)
    const warning = subs.length > 0
      ? `"${category.name}" tiene ${subs.length} subcategoría(s). Al borrarla, esas subcategorías quedan como categorías principales. ¿Continuar?`
      : `¿Eliminar "${category.name}"? Los productos que la tengan asignada quedan sin categoría.`

    if (!confirm(warning)) return

    try {
      const { error } = await supabase.from('categories').delete().eq('id', category.id)
      if (error) throw error

      setCategories(categories
        .filter(c => c.id !== category.id)
        .map(c => (c.parent_id === category.id ? { ...c, parent_id: null } : c))
      )
    } catch (error) {
      console.error('Error al eliminar:', error)
      alert('❌ Error al eliminar')
    }
  }

  async function move(category: Category, direction: 'up' | 'down') {
    const siblings = category.parent_id ? getSubcategories(category.parent_id) : mainCategories
    const idx = siblings.findIndex(c => c.id === category.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= siblings.length) return

    const swapWith = siblings[swapIdx]

    try {
      await Promise.all([
        supabase.from('categories').update({ order_position: swapWith.order_position }).eq('id', category.id),
        supabase.from('categories').update({ order_position: category.order_position }).eq('id', swapWith.id)
      ])

      setCategories(categories.map(c => {
        if (c.id === category.id) return { ...c, order_position: swapWith.order_position }
        if (c.id === swapWith.id) return { ...c, order_position: category.order_position }
        return c
      }))
    } catch (error) {
      console.error('Error al reordenar:', error)
      alert('❌ Error al reordenar')
    }
  }

  async function toggleVisibility(category: Category) {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ show_in_catalog: !category.show_in_catalog })
        .eq('id', category.id)

      if (error) throw error
      setCategories(categories.map(c =>
        c.id === category.id ? { ...c, show_in_catalog: !c.show_in_catalog } : c
      ))
    } catch (error) {
      console.error('Error al cambiar visibilidad:', error)
      alert('❌ Error al actualizar')
    }
  }

  if (!admin || loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-zinc-800 text-white">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-black">Categorías</h1>
            <p className="text-sm text-white/70">Organizá tu catálogo en categorías y subcategorías</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => openModal()}
          className="w-full mb-6 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all"
        >
          + Nueva Categoría
        </button>

        {mainCategories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🗂️</div>
            <p className="font-medium">Todavía no hay categorías</p>
            <p className="text-sm mt-1">Creá la primera para empezar a organizar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mainCategories.map((cat, idx) => {
              const subs = getSubcategories(cat.id)
              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Categoría principal */}
                  <div
                    className={`p-4 flex items-center gap-3 ${!cat.show_in_catalog ? 'opacity-50' : ''}`}
                    style={{ backgroundColor: cat.color || undefined }}
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => move(cat, 'up')}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded bg-white/70 disabled:opacity-30 text-xs"
                      >▲</button>
                      <button
                        onClick={() => move(cat, 'down')}
                        disabled={idx === mainCategories.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded bg-white/70 disabled:opacity-30 text-xs"
                      >▼</button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{cat.name}</p>
                      <p className="text-xs text-gray-600">
                        {subs.length > 0 ? `${subs.length} subcategoría${subs.length !== 1 ? 's' : ''}` : 'Sin subcategorías'}
                        {!cat.show_in_catalog && ' • Oculta del catálogo'}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleVisibility(cat)}
                      className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center text-sm"
                      title={cat.show_in_catalog ? 'Ocultar del catálogo' : 'Mostrar en catálogo'}
                    >
                      {cat.show_in_catalog ? '👁️' : '🚫'}
                    </button>
                    <button
                      onClick={() => openModal(undefined, cat.id)}
                      className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center text-sm"
                      title="Agregar subcategoría"
                    >
                      ➕
                    </button>
                    <button
                      onClick={() => openModal(cat)}
                      className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center text-sm"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => remove(cat)}
                      className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-sm"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Subcategorías */}
                  {subs.length > 0 && (
                    <div className="border-t border-gray-100">
                      {subs.map((sub, subIdx) => (
                        <div
                          key={sub.id}
                          className={`pl-10 pr-4 py-3 flex items-center gap-3 border-b border-gray-50 last:border-b-0 ${!sub.show_in_catalog ? 'opacity-50' : ''}`}
                          style={{ backgroundColor: sub.color || undefined }}
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => move(sub, 'up')}
                              disabled={subIdx === 0}
                              className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 text-[10px]"
                            >▲</button>
                            <button
                              onClick={() => move(sub, 'down')}
                              disabled={subIdx === subs.length - 1}
                              className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 disabled:opacity-30 text-[10px]"
                            >▼</button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{sub.name}</p>
                            {!sub.show_in_catalog && <p className="text-xs text-gray-500">Oculta del catálogo</p>}
                          </div>

                          <button
                            onClick={() => toggleVisibility(sub)}
                            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs"
                          >
                            {sub.show_in_catalog ? '👁️' : '🚫'}
                          </button>
                          <button
                            onClick={() => openModal(sub)}
                            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => remove(sub)}
                            className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />

            <h3 className="font-bold text-xl mb-6">
              {editing ? 'Editar categoría' : form.parent_id ? 'Nueva subcategoría' : 'Nueva categoría'}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Panchos"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Depende de</label>
                <select
                  value={form.parent_id}
                  onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="">Ninguna (es categoría principal)</option>
                  {mainCategories
                    .filter(c => !editing || c.id !== editing.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Elegí una categoría para convertir esta en subcategoría suya</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Color de fondo en el catálogo</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, color: '' })}
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs ${
                      !form.color ? 'border-blue-900 scale-110' : 'border-gray-200'
                    }`}
                    title="Sin color"
                  >
                    ∅
                  </button>
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-9 h-9 rounded-full border-2 transition-all ${
                        form.color === color ? 'border-blue-900 scale-110' : 'border-white shadow'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="relative w-9 h-9">
                    <input
                      type="color"
                      value={form.color || '#ffffff'}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Color personalizado"
                    />
                    <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xs pointer-events-none">
                      🎨
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_in_catalog}
                  onChange={(e) => setForm({ ...form, show_in_catalog: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <span className="font-semibold text-gray-700 text-sm">Mostrar en el catálogo público</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-60"
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
