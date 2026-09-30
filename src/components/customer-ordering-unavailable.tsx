import Link from 'next/link'

export function CustomerOrderingUnavailable() {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="text-4xl mb-3">🛍️</div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Pedidos temporalmente deshabilitados</h1>
        <p className="text-sm text-gray-600">Por el momento no está habilitado el acceso de clientes para realizar pedidos desde el catálogo.</p>
        <Link href="/catalogo" className="inline-block mt-6 px-5 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800">Volver al catálogo</Link>
    </div>
  )
}
