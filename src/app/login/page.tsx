'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Tipo sin PIN para seguridad
type EmployeePublic = {
  id: string
  name: string
  role: 'mostrador' | 'caja' | 'admin'
  created_at: string
}

export default function LoginPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<EmployeePublic[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePublic | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployees()
  }, [])

  async function loadEmployees() {
    // NO traemos el PIN, solo datos públicos
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, role, created_at')
      .order('name')

    if (error) {
      setError('Error al cargar empleados')
      console.error(error)
    } else {
      setEmployees(data || [])
    }
    setLoading(false)
  }

  function handlePinInput(digit: string) {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      setError('')
      
      if (navigator.vibrate) navigator.vibrate(30)
      
      if (newPin.length === 4 && selectedEmployee) {
        verifyPin(newPin) // Ya es async, se ejecuta
      }
    }
  }

  function handleBackspace() {
    setPin(pin.slice(0, -1))
    setError('')
  }

  async function verifyPin(enteredPin: string) {
    if (!selectedEmployee) return

    try {
      // Verificar PIN usando función segura con bloqueo
      const { data, error } = await supabase
        .rpc('verify_pin_secure', {
          p_employee_id: selectedEmployee.id,
          p_pin_attempt: enteredPin
        })

      if (error) {
        console.error('Error verificando PIN:', error)
        setError('Error al verificar')
        setPin('')
        return
      }

      if (data.blocked) {
        setError(`🔒 Bloqueado. Esperá ${data.remaining_minutes} min.`)
        setPin('')
        if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        return
      }

      if (data.success) {
        localStorage.setItem('employee', JSON.stringify(selectedEmployee))
        
        if (selectedEmployee.role === 'caja') {
          router.push('/caja')
        } else if (selectedEmployee.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/mostrador')
        }
      } else {
        const remaining = data.attempts_remaining
        if (remaining !== undefined && remaining <= 2) {
          setError(`PIN incorrecto. Quedan ${remaining} intentos.`)
        } else {
          setError('PIN incorrecto')
        }
        setPin('')
        if (navigator.vibrate) navigator.vibrate([100, 50, 100])
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión')
      setPin('')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'from-slate-600 to-slate-700'
      case 'caja': return 'from-emerald-500 to-teal-600'
      default: return 'from-blue-500 to-cyan-500'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case 'caja':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900">
        <div className="text-white text-lg animate-pulse-soft">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 p-4">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-cyan-400 rounded-3xl flex items-center justify-center mb-4 shadow-2xl shadow-blue-500/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white">Distribuidora</h1>
            <p className="text-slate-400 mt-1">Sistema de Ventas</p>
          </div>

          {!selectedEmployee ? (
            /* Selección de empleado */
            <div className="card-elevated p-5 animate-scale-in">
              <h2 className="text-lg font-bold mb-4 text-center text-text">¿Quién sos?</h2>
              <div className="space-y-3">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className="w-full p-4 text-left rounded-2xl bg-bg hover:bg-surface-hover active:scale-[0.98] transition-all flex items-center gap-4 group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleColor(emp.role)} flex items-center justify-center text-white shadow-lg`}>
                      {getRoleIcon(emp.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-lg text-text">{emp.name}</div>
                      <div className="text-sm text-text-muted capitalize">{emp.role}</div>
                    </div>
                    <svg className="w-5 h-5 text-text-light group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Ingreso de PIN */
            <div className="card-elevated p-6 animate-scale-in">
              <button
                onClick={() => {
                  setSelectedEmployee(null)
                  setPin('')
                  setError('')
                }}
                className="text-text-muted hover:text-text mb-4 flex items-center gap-1 active:scale-95 transition-transform"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>

              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${getRoleColor(selectedEmployee.role)} flex items-center justify-center mb-3 shadow-lg`}>
                  <span className="text-2xl font-bold text-white">
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-text">{selectedEmployee.name}</h2>
                <p className="text-text-muted text-sm">Ingresá tu PIN</p>
              </div>

              {/* Indicador de PIN */}
              <div className="flex justify-center gap-4 mb-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      pin.length > i 
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-400 scale-125 shadow-lg shadow-blue-500/50' 
                        : 'bg-border'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="bg-danger/10 text-danger text-center text-sm py-2 px-4 rounded-xl mb-4 font-medium">
                  {error}
                </div>
              )}

              {/* Teclado numérico moderno */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'back'].map((key, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (key === 'back') handleBackspace()
                      else if (key !== null) handlePinInput(key.toString())
                    }}
                    disabled={key === null}
                    className={`h-16 rounded-2xl text-2xl font-bold transition-all active:scale-95 select-none ${
                      key === null
                        ? 'invisible'
                        : key === 'back'
                        ? 'bg-danger/10 text-danger active:bg-danger/20'
                        : 'bg-bg hover:bg-surface-hover text-text'
                    }`}
                  >
                    {key === 'back' ? (
                      <svg className="w-7 h-7 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                      </svg>
                    ) : (
                      key
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-slate-500 text-sm">v1.0.0</p>
      </div>
    </div>
  )
}
