'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)

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
  }, [router])

  if (!admin) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-4xl font-black text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600">Bienvenido, {admin?.name}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* PRODUCTOS */}
          <button onClick={() => router.push('/productos')} className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl hover:shadow-lg transition-all text-left">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="font-bold text-lg text-gray-900">Productos</h3>
            <p className="text-sm text-gray-600">Gestiona tu catálogo</p>
          </button>

          {/* PRECIOS */}
          <button onClick={() => router.push('/precios')} className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl hover:shadow-lg transition-all text-left">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-lg text-gray-900">Precios</h3>
            <p className="text-sm text-gray-600">Configura precios</p>
          </button>

          {/* EMPLEADOS */}
          <button onClick={() => router.push('/empleados')} className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl hover:shadow-lg transition-all text-left">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="font-bold text-lg text-gray-900">Empleados</h3>
            <p className="text-sm text-gray-600">Gestiona usuarios</p>
          </button>

          {/* DESCUENTOS */}
          <button onClick={() => router.push('/descuentos')} className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-2xl hover:shadow-lg transition-all text-left">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="font-bold text-lg text-gray-900">Descuentos</h3>
            <p className="text-sm text-gray-600">Crea ofertas</p>
          </button>

          {/* CATÁLOGO */}
          <button onClick={() => router.push('/catalogo')} className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-2xl hover:shadow-lg transition-all text-left">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="font-bold text-lg text-gray-900">Catálogo</h3>
            <p className="text-sm text-gray-600">Gestiona categorías</p>
          </button>

          {/* EDICIÓN WEB - PRINCIPAL */}
          <button onClick={() => router.push('/admin/edicion-web')} className="p-6 bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 border-2 border-pink-300 rounded-2xl hover:shadow-2xl hover:border-pink-400 transition-all text-left hover:-translate-y-1 ring-2 ring-pink-200 ring-opacity-50">
            <div className="text-5xl mb-3">🎨</div>
            <h3 className="font-bold text-lg text-gray-900">Edición Web</h3>
            <p className="text-sm text-gray-600 font-semibold">Configura landing, hero y secciones</p>
          </button>
        </div>

        {/* LOGOUT */}
        <div className="mt-12 text-center">
          <button onClick={() => { localStorage.removeItem('employee'); router.push('/login') }} className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold text-lg transition-all">
            🚪 Cerrar Sesión
          </button>
        </div>
      </main>
    </div>
  )
}
