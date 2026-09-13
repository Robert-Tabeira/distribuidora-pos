'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { hashPin, normalizePhone, type Customer } from '@/lib/customer-auth'

export default function AdminClientesPage() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [newPin, setNewPin] = useState<string | null>(null)

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

  const filtered = customers.filter(c => {
    const q = normalizePhone(searchQuery)
    if (!searchQuery.trim()) return true
    return (
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            <p className="text-sm text-gray-600">Buscar y resetear códigos de acceso</p>
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

        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No hay clientes que coincidan</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(customer => (
              <div key={customer.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.phone}{customer.email ? ` • ${customer.email}` : ''}</p>
                </div>
                <button
                  onClick={() => resetPin(customer)}
                  disabled={resettingId === customer.id}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 flex-shrink-0"
                >
                  {resettingId === customer.id ? 'Generando...' : 'Restablecer código'}
                </button>
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
