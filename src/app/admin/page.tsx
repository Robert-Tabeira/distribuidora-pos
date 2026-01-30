'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Employee, Product } from '@/types/database'

export default function AdminPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pendingProducts: 0,
    totalProducts: 0,
    todayOrders: 0,
    weekOrders: 0
  })

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
    loadStats()
  }, [router])

  async function loadStats() {
    // Obtener productos pendientes y totales
    const { data: products } = await supabase.from('products').select('status')
    
    const pendingProducts = products?.filter(p => p.status === 'pending').length || 0
    const totalProducts = products?.length || 0

    // Obtener pedidos de hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayOrdersData } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'completed')
      .gte('completed_at', today.toISOString())

    // Obtener pedidos de la semana (Lunes a Sábado)
    const monday = getMonday(new Date())
    const saturday = new Date(monday)
    saturday.setDate(monday.getDate() + 5)
    saturday.setHours(23, 59, 59, 999)

    const { data: weekOrdersData } = await supabase
      .from('orders')
      .select('id')
      .eq('status', 'completed')
      .gte('completed_at', monday.toISOString())
      .lte('completed_at', saturday.toISOString())

    setStats({
      pendingProducts,
      totalProducts,
      todayOrders: todayOrdersData?.length || 0,
      weekOrders: weekOrdersData?.length || 0
    })
    
    setLoading(false)
  }

  function getMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setHours(0, 0, 0, 0)
    d.setDate(diff)
    return d
  }

  function logout() {
    localStorage.removeItem('employee')
    router.push('/login')
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
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Admin</h1>
                <p className="text-sm text-white/70">{employee?.name}</p>
              </div>
            </div>
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
        
        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Contenido */}
      <div className="flex-1 -mt-2 px-4 pb-4 space-y-4">
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="text-3xl font-bold text-primary">{stats.todayOrders}</div>
            <div className="text-sm text-text-muted">Pedidos hoy</div>
          </div>
          <div className="card p-4">
            <div className="text-3xl font-bold text-success">{stats.weekOrders}</div>
            <div className="text-sm text-text-muted">Esta semana</div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="space-y-3">
          <h2 className="font-semibold text-text-muted text-sm px-1">GESTIÓN</h2>
          
          {/* Productos pendientes */}
          <button
            onClick={() => router.push('/productos')}
            className="w-full card p-4 flex items-center gap-4 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-warning/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-text">Productos sin agregar</div>
              <div className="text-sm text-text-muted">Configurar productos nuevos</div>
            </div>
            {stats.pendingProducts > 0 && (
              <span className="px-3 py-1 bg-warning text-white rounded-full text-sm font-bold">
                {stats.pendingProducts}
              </span>
            )}
            <svg className="w-5 h-5 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Todos los productos */}
          <button
            onClick={() => router.push('/productos?tab=complete')}
            className="w-full card p-4 flex items-center gap-4 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-text">Todos los productos</div>
              <div className="text-sm text-text-muted">{stats.totalProducts} productos</div>
            </div>
            <svg className="w-5 h-5 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Historial */}
          <button
            onClick={() => router.push('/historial')}
            className="w-full card p-4 flex items-center gap-4 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-text">Historial de pedidos</div>
              <div className="text-sm text-text-muted">Ver pedidos de la semana</div>
            </div>
            <svg className="w-5 h-5 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Empleados */}
          <button
            onClick={() => router.push('/empleados')}
            className="w-full card p-4 flex items-center gap-4 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-text">Empleados</div>
              <div className="text-sm text-text-muted">Agregar o quitar usuarios</div>
            </div>
            <svg className="w-5 h-5 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Accesos a otras pantallas */}
        <div className="space-y-3 pt-2">
          <h2 className="font-semibold text-text-muted text-sm px-1">IR A</h2>
          
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => router.push('/mostrador')}
              className="card p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="font-medium text-text text-sm">Mostrador</span>
            </button>

            <button
              onClick={() => router.push('/caja')}
              className="card p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="font-medium text-text text-sm">Caja</span>
            </button>

            <button
              onClick={() => router.push('/reposicion')}
              className="card p-4 flex flex-col items-center gap-2 active:scale-[0.98] transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="font-medium text-text text-sm">Reposición</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
