'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type EmployeePublic = {
  id: string
  name: string
  role: 'mostrador' | 'caja' | 'admin'
  created_at: string
}

export default function EmpleadosPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<EmployeePublic | null>(null)
  const [employees, setEmployees] = useState<EmployeePublic[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal nuevo/editar
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeePublic | null>(null)
  const [formName, setFormName] = useState('')
  const [formRole, setFormRole] = useState<'mostrador' | 'caja' | 'admin'>('mostrador')
  const [formPin, setFormPin] = useState('')
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
    setEmployee(emp)
    loadEmployees()
  }, [router])

  async function loadEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, role, created_at')
      .order('name')

    if (!error && data) {
      setEmployees(data)
    }
    setLoading(false)
  }

  function openNewModal() {
    setEditingEmployee(null)
    setFormName('')
    setFormRole('mostrador')
    setFormPin('')
    setShowModal(true)
  }

  function openEditModal(emp: EmployeePublic) {
    setEditingEmployee(emp)
    setFormName(emp.name)
    setFormRole(emp.role)
    setFormPin('')
    setShowModal(true)
  }

  async function saveEmployee() {
    if (!formName.trim()) return
    if (!editingEmployee && formPin.length !== 4) {
      alert('El PIN debe tener 4 dígitos')
      return
    }

    setSaving(true)

    try {
      if (editingEmployee) {
        // Actualizar empleado existente
        const updateData: { name: string; role: string; pin?: string } = {
          name: formName.trim(),
          role: formRole,
        }

        // Si se ingresó un nuevo PIN, hashearlo
        if (formPin.length === 4) {
          const { data: hashData } = await supabase.rpc('hash_pin', { pin: formPin })
          if (hashData) {
            updateData.pin = hashData
          }
        }

        const { error } = await supabase
          .from('employees')
          .update(updateData)
          .eq('id', editingEmployee.id)

        if (error) throw error
      } else {
        // Crear nuevo empleado
        const { data: hashData } = await supabase.rpc('hash_pin', { pin: formPin })
        
        if (!hashData) {
          throw new Error('Error al generar PIN')
        }

        const { error } = await supabase
          .from('employees')
          .insert({
            name: formName.trim(),
            role: formRole,
            pin: hashData,
          })

        if (error) throw error
      }

      setShowModal(false)
      loadEmployees()
      if (navigator.vibrate) navigator.vibrate(50)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function deleteEmployee(emp: EmployeePublic) {
    // No permitir eliminar al admin actual
    if (emp.id === employee?.id) {
      alert('No podés eliminarte a vos mismo')
      return
    }

    // Verificar que no sea el único admin
    const admins = employees.filter(e => e.role === 'admin')
    if (emp.role === 'admin' && admins.length === 1) {
      alert('No podés eliminar al único administrador')
      return
    }

    if (!confirm(`¿Eliminar a ${emp.name}?`)) return

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', emp.id)

    if (error) {
      console.error('Error:', error)
      alert('Error al eliminar')
    } else {
      loadEmployees()
      if (navigator.vibrate) navigator.vibrate(50)
    }
  }

  function getRoleColor(role: string) {
    switch (role) {
      case 'admin': return 'from-purple-500 to-indigo-600'
      case 'caja': return 'from-emerald-500 to-teal-500'
      default: return 'from-blue-500 to-cyan-500'
    }
  }

  function getRoleLabel(role: string) {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'caja': return 'Caja'
      default: return 'Mostrador'
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
                <h1 className="font-bold text-lg leading-tight">Empleados</h1>
                <p className="text-sm text-white/70">{employees.length} usuarios</p>
              </div>
            </div>
            <button 
              onClick={openNewModal}
              className="w-11 h-11 flex items-center justify-center bg-white/20 rounded-xl active:scale-95 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Lista de empleados */}
      <div className="flex-1 -mt-2 px-4 pb-4">
        <div className="card overflow-hidden">
          {employees.map((emp, idx) => (
            <div
              key={emp.id}
              className={`flex items-center gap-4 p-4 ${
                idx !== employees.length - 1 ? 'border-b border-border-light' : ''
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleColor(emp.role)} flex items-center justify-center text-white font-bold text-lg`}>
                {emp.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-text">{emp.name}</div>
                <div className="text-sm text-text-muted">{getRoleLabel(emp.role)}</div>
              </div>
              
              {/* Botones de acción */}
              <button
                onClick={() => openEditModal(emp)}
                className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              
              {emp.id !== employee?.id && (
                <button
                  onClick={() => deleteEmployee(emp)}
                  className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center active:scale-95 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal nuevo/editar */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-surface w-full max-w-lg rounded-t-3xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
            
            <h3 className="font-bold text-xl text-center mb-6">
              {editingEmployee ? 'Editar empleado' : 'Nuevo empleado'}
            </h3>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="input"
                  autoFocus
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Rol</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['mostrador', 'caja', 'admin'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setFormRole(role)}
                      className={`py-3 rounded-xl border-2 transition-all font-medium text-sm ${
                        formRole === role 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {getRoleLabel(role)}
                    </button>
                  ))}
                </div>
              </div>

              {/* PIN */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  {editingEmployee ? 'Nuevo PIN (dejar vacío para mantener)' : 'PIN (4 dígitos)'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="input text-center text-2xl tracking-widest"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={saveEmployee}
                disabled={!formName.trim() || saving || (!editingEmployee && formPin.length !== 4)}
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