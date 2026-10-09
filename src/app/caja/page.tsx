'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Employee, Order, OrderItem } from '@/types/database'

type OrderWithDetails = Order & {
  items: OrderItem[]
  employee: Employee | null
}

export default function CajaPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const prevOrderCount = useRef(0)

  useEffect(() => {
    const stored = localStorage.getItem('employee')
    if (!stored) {
      router.push('/login')
      return
    }
    setEmployee(JSON.parse(stored))
    loadOrders()

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          loadOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  useEffect(() => {
    if (orders.length > prevOrderCount.current && prevOrderCount.current > 0) {
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      }
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp2akYl/c2Jla3R/iI+Uk5KOh31xZ2Nsc36Gio2OjYmDeXBnZ3B8h46SkpGNiIF3bmlrcnyFi46PjouFfHNtbnR+h4uNjYuGgHhxbnJ5gYaJi4qIhH96dnV4fYKFh4eGhIF9enl6fYCDhYWEgoB9e3t8foCCg4OCgH5+fn5/gIGBgYB/fn5+fn+AgICAf39+fn5/f4CAgH9/fn5+f3+AgIB/f35+fn5/f4B/f39/fn5+fn9/f39/f35+fn5+f39/f39/fn5+fn5/f39/f39+fn5+fn9/f39/f35+fn5+f39/f39/fn5+fn5/f39/f39+fn5+fn5/f39/f35+fn5+f39/f39/fn5+fn5/f39/f39+fn5+fn5/f39/fn5+fn5+f39/f39+fn5+fn5/f39/f35+fn5+fn9/f39/fn5+fn5+f39/f39+fn5+fn5/f39/f35+fn5+fn9/f39+fn5+fn5/f39/f35+fn5+fn9/f35+fn5+fn5/f39/fn5+fn5+f39/f35+fn5+fn5/f39+fn5+fn5+f39/fn5+fn5+fn9/f35+fn5+fn5/f39+fn5+fn5+f39+fn5+fn5+fn5/fn5+fn5+fn5+f35+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fg==')
        audio.volume = 0.5
        audio.play().catch(() => {})
      } catch {}
    }
    prevOrderCount.current = orders.length
  }, [orders.length])

  async function loadOrders() {
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'sent')
      .order('sent_at', { ascending: true })

    if (error) {
      console.error('Error loading orders:', error)
      setLoading(false)
      return
    }

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

  function logout() {
    localStorage.removeItem('employee')
    router.push('/login')
  }

  async function completeOrder(order: OrderWithDetails) {
    setCompleting(true)
    
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (error) {
      console.error('Error completing order:', error)
      alert('Error al finalizar el pedido')
    } else {
      if (navigator.vibrate) navigator.vibrate(100)
      setSelectedOrder(null)
      loadOrders()
    }
    
    setCompleting(false)
  }

  function formatItemDisplay(item: OrderItem) {
    let display = `${item.quantity}x ${item.product_name}`
    if (item.weight) display += ` - ${item.weight}kg`
    if (item.volume) display += ` - ${item.volume}L`
    return display
  }

  function timeAgo(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Ahora'
    if (diffMins === 1) return '1 min'
    if (diffMins < 60) return `${diffMins} min`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return '1 hora'
    return `${diffHours} horas`
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="animate-pulse-soft text-text-muted">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg">
      {/* Header con gradiente verde */}
      <header className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white sticky top-0 z-20">
        <div className="px-4 pt-safe-top">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">Caja</h1>
                <p className="text-sm text-white/70">{employee?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl text-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse-soft"></span>
                En vivo
              </div>
              {employee?.role === 'admin' && (
                <button 
                  onClick={() => router.push('/admin')}
                  className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
                  title="Volver a Admin"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
              <button 
                onClick={() => router.push('/historial')}
                className="w-11 h-11 flex items-center justify-center bg-white/10 rounded-xl active:scale-95 transition-all"
                title="Historial"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
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
        </div>
        
        {/* Curva decorativa */}
        <div className="h-6 bg-bg rounded-t-[2rem]"></div>
      </header>

      {/* Contenido */}
      <div className="flex-1 -mt-2 px-4 pb-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl bg-surface flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-12 h-12 text-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text">No hay pedidos</h3>
            <p className="text-text-muted mt-2 text-center">Los pedidos aparecerán aquí<br/>en tiempo real</p>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {/* Counter */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xl text-text">Pedidos pendientes</h2>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg">
                {orders.length}
              </div>
            </div>
            
            {/* Lista de pedidos */}
            {orders.map((order, idx) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="card p-4 cursor-pointer active:scale-[0.98] transition-all hover:shadow-lg animate-scale-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
                    {order.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg text-text truncate">{order.customer_name}</h3>
                      <span className="badge badge-success flex-shrink-0">
                        {order.sent_at && timeAgo(order.sent_at)}
                      </span>
                    </div>
                    <p className="text-text-muted text-sm mt-1">
                      Por: {order.employee?.name || 'Desconocido'}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="badge badge-primary">
                        {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-text-light flex-shrink-0 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                {/* Preview de items */}
                <div className="mt-4 pt-4 border-t border-border-light">
                  <p className="text-sm text-text-muted line-clamp-1">
                    {order.items.slice(0, 2).map(item => formatItemDisplay(item)).join(' • ')}
                    {order.items.length > 2 && ` +${order.items.length - 2} más`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-surface w-full max-w-lg rounded-t-3xl flex flex-col max-h-[90vh] animate-slide-up" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-6" />
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedOrder.customer_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-2xl text-text">{selectedOrder.customer_name}</h3>
                  <p className="text-text-muted">
                    Atendido por: {selectedOrder.employee?.name || 'Desconocido'}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-3">
                {selectedOrder.items.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-bg rounded-2xl">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
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
                onClick={() => completeOrder(selectedOrder)}
                disabled={completing}
                className="w-full btn btn-success py-5 text-lg flex items-center justify-center gap-3"
              >
                {completing ? 'Finalizando...' : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Finalizar pedido
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
