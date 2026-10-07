import { NextResponse } from 'next/server'

// La recuperación de cuentas de clientes permanece pausada junto al catálogo
// de pedidos, hasta que exista una autenticación de cliente verificable.
export async function POST() {
  return NextResponse.json(
    { error: 'La recuperación de códigos está temporalmente deshabilitada.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  )
}
