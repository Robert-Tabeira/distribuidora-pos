'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type LocationInfo = {
  name: string
  count: number
}

export default function UbicacionesPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<LocationInfo[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal editar
  const [editingLocation, setEditingLocation] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
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
    loadLocations()
  }, [router])

  async function loadLocations() {
    const { data, error } = await supabase
      .from('products')
      .select('location')
      .not('location', 'is', null)

    if (!error && data) {
      // Contar productos por ubicación
      const counts: Record<string, number> = {}
      data.forEach(p => {
        if (p.location) {
          counts[p.location] = (counts[p.location] || 0) + 1
        }
      })
      
      // Convertir a array ordenado
      const locationList = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name))
      
      setLocations(locationList)
    }
    setLoading(false)
  }

  function openEditModal(locationName: string) {
    setEditingLocation(locationName)
    setEditName(locationName)
  }

  function closeEditModal() {
    setEditingLocation(null)
    setEditName('')
  }

  async function saveLocation() {
    if (!editingLocation || !editName.trim()) return
    
    const newName = editName.trim()
    
    // Si es el mismo nombre, no hacer nada
    if (newName === editingLocation) {
      closeEditModal()
      return
    }

    setSaving(true)

    try {
      // Actualizar todos los productos con esta ubicación
      const { error } = await supabase
        .from('products')
        .update({ location: newName })
        .eq('location', editingLocation)

      if (error) throw error

      closeEditModal()
      loadLocations()
      if (navigator.vibrate) navigator.vibrate(50)

    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar la ubicación')
    } finally {
      setSaving(false)
    }
  }

  async function deleteLocation(locationName: string) {
    const loc = locations.find(l => l.name === locationName)
    if (!loc) return

    if (!confirm(`¿Quitar la ubicación "${locationName}" de ${loc.count} producto(s)?\n\nLos productos no se eliminarán, solo quedarán sin ubicación.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ location: null })
        .eq('location', locationName)

      if (error) throw error

      loadLocations()
      if (navigator.vibrate) navigator.vibrate(50)

    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la ubicación')
    }
  }

  async function mergeLocations(fromLocation: string, toLocation: string) {
    if (fromLocation === toLocation) return

    try {
      const { error } = await supabase
        .from('products')
        .update({ location: toLocation })
        .eq('location', fromLocation)

      if (error) throw error

      loadLocations()
      if (navigator.vibrate) navigator.vibrate(50)

    } catch (error) {
      console.error('Error:', error)
      alert('Error al fusionar ubicaciones')
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
                onClick={() => router.push('/admin')}
                className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="font-bold text-lg leading-tight">Ubicaciones</h1>
                <p className="text-sm text-white/70">{locations.length} ubicaciones</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Lista */}
      <div className="flex-1 -mt-2 px-4 pb-4">
        {locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <div className="w-20 h-20 rounded-3xl bg-surface flex items-center justify-center mb-4">
              <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-medium text-lg">Sin ubicaciones</p>
            <p className="text-sm mt-1">Las ubicaciones se crean al agregar productos</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {locations.map((loc, idx) => (
              <div
                key={loc.name}
                className={`flex items-center gap-4 p-4 ${
                  idx !== locations.length - 1 ? 'border-b border-border-light' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text">{loc.name}</div>
                  <div className="text-sm text-text-muted">
                    {loc.count} {loc.count === 1 ? 'producto' : 'productos'}
                  </div>
                </div>
                
                {/* Botones */}
                <button
                  onClick={() => openEditModal(loc.name)}
                  className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => deleteLocation(loc.name)}
                  className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        {locations.length > 0 && (
          <p className="text-center text-text-muted text-sm mt-4">
            Al editar una ubicación, se actualiza en todos sus productos.<br/>
            Al eliminarla, los productos quedan sin ubicación.
          </p>
        )}
      </div>

      {/* Modal editar */}
      {editingLocation && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50"
          onClick={closeEditModal}
        >
          <div 
            className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            
            <h3 className="font-bold text-xl text-center mb-2">Editar ubicación</h3>
            <p className="text-center text-text-muted text-sm mb-6">
              Se actualizará en {locations.find(l => l.name === editingLocation)?.count || 0} producto(s)
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-muted mb-2">Nombre</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ej: Pasillo 3"
                className="input"
                autoFocus
              />
            </div>

            {/* Sugerencia de fusión si hay ubicaciones similares */}
            {locations.filter(l => 
              l.name !== editingLocation && 
              l.name.toLowerCase().includes(editName.toLowerCase().trim())
            ).length > 0 && editName.trim() && (
              <div className="mb-6 p-4 bg-warning/10 rounded-xl">
                <p className="text-sm font-medium text-amber-700 mb-2">¿Fusionar con existente?</p>
                <div className="flex flex-wrap gap-2">
                  {locations
                    .filter(l => 
                      l.name !== editingLocation && 
                      l.name.toLowerCase().includes(editName.toLowerCase().trim())
                    )
                    .map(l => (
                      <button
                        key={l.name}
                        onClick={() => {
                          if (confirm(`¿Fusionar "${editingLocation}" con "${l.name}"?\n\nTodos los productos pasarán a "${l.name}".`)) {
                            mergeLocations(editingLocation, l.name)
                            closeEditModal()
                          }
                        }}
                        className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50"
                      >
                        {l.name} ({l.count})
                      </button>
                    ))
                  }
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeEditModal}
                className="flex-1 btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={saveLocation}
                disabled={!editName.trim() || saving}
                className="flex-1 btn btn-primary"
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
