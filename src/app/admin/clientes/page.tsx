'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { hashPin, normalizePhone, type Customer } from '@/lib/customer-auth'

export default function AdminClientesPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [newPin, setNewPin] = useState<string | null>(null)
  const [updatingApprovalId, setUpdatingApprovalId] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('employee')
    if (!stored) {
      router.push('/login')
      return
    }
    setAdmin(JSON.parse(stored))
    loadCustomers()
  }, [router])

  async function loadCustomers() {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false })
    if (data) setCustomers(data)
    setLoading(false)
  }

  function generateTempPin() {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  async function resetPin(customer: Customer) {
    if (!confirm(`¿Generar un código nuevo para ${customer.name}?`)) return

    setResettingId(customer.id)
    try {
      const tempPin = generateTempPin()
      const pinHash = await hashPin(tempPin)

      const { error } = await supabase
        .from('customers')
        .update({ pin_hash: pinHash })
        .eq('id', customer.id)

      if (error) throw error

      setNewPin(tempPin)
    } catch (error) {
      console.error('Error al resetear código:', error)
      alert('Error al resetear el código')
    } finally {
      setResettingId(null)
    }
  }

  async function setApproval(customer: Customer, status: 'approved' | 'rejected') {
    setUpdatingApprovalId(customer.id)
    const { error } = await supabase.from('customers').update({ approval_status: status }).eq('id', customer.id)
    if (error) {
      console.error('Error al actualizar aprobación:', error)
      alert('No se pudo actualizar la solicitud')
    } else {
      setCustomers(current => current.map(item => item.id === customer.id ? { ...item, approval_status: status } : item))
    }
    setUpdatingApprovalId(null)
  }

  const filtered = customers.filter(c => {
    if (statusFilter !== 'all' && (c.approval_status || 'approved') !== statusFilter) return false
    const q = normalizePhone(searchQuery)
    if (!searchQuery.trim()) return true
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q && normalizePhone(c.phone).includes(q))
    )
  })

  if (!admin || loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
          <button onClick={() => router.push('/admin')} className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl">
            ←
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Clientes</h1>
            <p className="text-sm text-gray-600">Revisar solicitudes, aprobar comercios y gestionar accesos</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-6 focus:outline-none focus:ring-2 focus:ring-blue-900"
        />

        <div className="flex gap-2 overflow-x-auto mb-6">
          {([
            ['pending', 'Pendientes'],
            ['approved', 'Aprobados'],
            ['rejected', 'No aprobados'],
            ['all', 'Todos']
          ] as const).map(([status, label]) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${statusFilter === status ? 'bg-blue-900 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}>
              {label}{status === 'pending' && <span className="ml-2">{customers.filter(customer => customer.approval_status === 'pending').length}</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No hay clientes que coincidan</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(customer => (
              <div key={customer.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap"><p className="font-semibold text-gray-900">{customer.business_name || customer.name}</p><span className={`text-xs px-2 py-1 rounded-full font-semibold ${customer.approval_status === 'approved' ? 'bg-green-100 text-green-800' : customer.approval_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{customer.approval_status === 'approved' ? 'Aprobado' : customer.approval_status === 'rejected' ? 'No aprobado' : 'Pendiente'}</span></div>
                  {customer.business_name && <p className="text-sm text-gray-700">Contacto: {customer.name}</p>}
                  <p className="text-sm text-gray-600">{customer.phone}{customer.email ? ` • ${customer.email}` : ''}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2 flex-shrink-0">
                  {customer.approval_status !== 'approved' && <button onClick={() => setApproval(customer, 'approved')} disabled={updatingApprovalId === customer.id} className="px-3 py-2 bg-green-700 text-white rounded-lg font-semibold text-sm hover:bg-green-800 disabled:opacity-50">Aprobar</button>}
                  {customer.approval_status !== 'rejected' && <button onClick={() => setApproval(customer, 'rejected')} disabled={updatingApprovalId === customer.id} className="px-3 py-2 border border-red-300 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-50 disabled:opacity-50">No aprobar</button>}
                  <button onClick={() => resetPin(customer)} disabled={resettingId === customer.id} className="px-3 py-2 bg-blue-900 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50">{resettingId === customer.id ? 'Generando...' : 'Restablecer código'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal con el código nuevo generado */}
      {newPin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setNewPin(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">✅</div>
            <p className="font-semibold text-gray-900 mb-2">Código nuevo generado</p>
            <p className="text-4xl font-black tracking-widest bg-gray-100 rounded-xl py-4 mb-4">{newPin}</p>
            <p className="text-sm text-gray-600 mb-5">Pasáselo al cliente (por WhatsApp o teléfono). No queda guardado en ningún lado más que acá.</p>
            <button onClick={() => setNewPin(null)} className="w-full py-2.5 bg-gray-200 rounded-xl font-semibold">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
