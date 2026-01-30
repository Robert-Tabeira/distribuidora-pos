'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Employee, Order, OrderItem } from '@/types/database'

type OrderWithDetails = Order & {
  items: OrderItem[]
  employee: Employee | null
}

type GroupedOrders = {
  [date: string]: OrderWithDetails[]
}

export default function HistorialPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [weekStart, setWeekStart] = useState<Date>(new Date())

  useEffect(() => {
    const stored = localStorage.getItem('employee')
    if (!stored) {
      router.push('/login')
      return
    }
    setEmployee(JSON.parse(stored))
    
    // Calcular el lunes de esta semana
    const monday = getMonday(new Date())
    setWeekStart(monday)
    loadOrders(monday)
  }, [router])

  // Obtener el lunes de la semana
  function getMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Ajustar si es domingo
    d.setHours(0, 0, 0, 0)
    d.setDate(diff)
    return d
  }

  // Obtener el sábado de la semana
  function getSaturday(monday: Date): Date {
    const saturday = new Date(monday)
    saturday.setDate(monday.getDate() + 5)
    saturday.setHours(23, 59, 59, 999)
    return saturday
  }

  async function loadOrders(monday: Date) {
    setLoading(true)
    
    const saturday = getSaturday(monday)
    
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'completed')
      .gte('completed_at', monday.toISOString())
      .lte('completed_at', saturday.toISOString())
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('Error loading orders:', error)
      setLoading(false)
      return
    }

    // Cargar items y empleados para cada pedido
    const ordersWithDetails: OrderWithDetails[] = await Promise.all(
      (ordersData || []).map(async (order) => {
        const [itemsRes, employeeRes] = await Promise.all([
          supabase.from('order_items').select('*').eq('order_id', order.id),
          order.employee_id 
            ? supabase.from('employees').select('*').eq('id', order.employee_id).single()
            : Promise.resolve({ data: null })
        ])

        return {
          ...order,
          items: itemsRes.data || [],
          employee: employeeRes.data,
        }
      })
    )

    setOrders(ordersWithDetails)
    setLoading(false)
  }

  function goBack() {
    router.back()
  }

  // Agrupar pedidos por día
  function groupByDay(orders: OrderWithDetails[]): GroupedOrders {
    return orders.reduce((groups, order) => {
      if (!order.completed_at) return groups
      const date = new Date(order.completed_at).toLocaleDateString('es-UY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(order)
      return groups
    }, {} as GroupedOrders)
  }

  function formatTime(dateString: string | null) {
    if (!dateString) return ''
    return new Date(dateString).toLocaleTimeString('es-UY', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatItemDisplay(item: OrderItem) {
    if (item.weight) return `${item.product_name} - ${item.weight}kg`
    if (item.volume) return `${item.product_name} - ${item.volume}L`
    return `${item.quantity}x ${item.product_name}`
  }

  const groupedOrders = groupByDay(orders)
  const days = Object.keys(groupedOrders)

  // Estadísticas de la semana
  const totalOrders = orders.length
  const totalItems = orders.reduce((sum, o) => sum + o.items.length, 0)

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="animate-pulse text-text-muted">Cargando historial...</div>
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
                <h1 className="font-bold text-lg leading-tight">Historial</h1>
                <p className="text-sm text-white/70">Semana actual</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Stats */}
      <div className="px-4 -mt-2 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-primary">{totalOrders}</div>
            <div className="text-sm text-text-muted">Pedidos</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-3xl font-bold text-success">{totalItems}</div>
            <div className="text-sm text-text-muted">Productos</div>
          </div>
        </div>
      </div>

      {/* Lista de pedidos por día */}
      <div className="flex-1 px-4 pb-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-text-muted">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
              <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-medium">No hay pedidos esta semana</p>
            <p className="text-sm mt-1">Los pedidos completados aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-6">
            {days.map(day => (
              <div key={day}>
                {/* Header del día */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-text capitalize">{day}</h2>
                    <p className="text-sm text-text-muted">{groupedOrders[day].length} pedido{groupedOrders[day].length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Pedidos del día */}
                <div className="card overflow-hidden">
                  {groupedOrders[day].map((order, idx) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`flex items-center gap-4 p-4 active:bg-surface-hover transition-colors cursor-pointer ${
                        idx !== groupedOrders[day].length - 1 ? 'border-b border-border-light' : ''
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-lg font-bold">
                        {order.customer_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-text truncate">{order.customer_name}</div>
                        <div className="text-sm text-text-muted">
                          {order.items.length} producto{order.items.length !== 1 ? 's' : ''} • {formatTime(order.completed_at)}
                        </div>
                      </div>
                      <div className="badge badge-success">
                        ✓
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl flex flex-col max-h-[85vh] animate-slide-up" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xl font-bold">
                  {selectedOrder.customer_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-text">{selectedOrder.customer_name}</h3>
                  <p className="text-text-muted text-sm">
                    {selectedOrder.employee?.name || 'Desconocido'} • {formatTime(selectedOrder.completed_at)}
                  </p>
                </div>
                <div className="badge badge-success px-3 py-1">
                  Completado
                </div>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="flex-1 overflow-auto p-6">
              <h4 className="font-semibold text-text-muted text-sm mb-3">PRODUCTOS</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-bg rounded-xl">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="flex-1 font-medium text-text">{formatItemDisplay(item)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full btn btn-outline"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
