import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('employees')
    .select('id, name, role')
    .order('name')

  if (error) {
    console.error('Error al listar empleados para login:', error)
    return NextResponse.json({ error: 'No se pudieron cargar los empleados' }, { status: 503 })
  }

  return NextResponse.json({ employees: data ?? [] }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
