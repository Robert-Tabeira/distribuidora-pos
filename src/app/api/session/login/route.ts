import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createEmployeeSession, EMPLOYEE_SESSION_COOKIE, employeeSessionCookieOptions } from '@/lib/employee-session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
  }
  let body: { employeeId?: unknown; pin?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const employeeId = typeof body.employeeId === 'string' ? body.employeeId : ''
  const pin = typeof body.pin === 'string' ? body.pin : ''
  if (!employeeId || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  const verificationResult = await supabaseAdmin.rpc('verify_pin_secure' as any, {
    p_employee_id: employeeId,
    p_pin_attempt: pin,
  } as any)
  const verification = verificationResult.data as any
  const verificationError = verificationResult.error

  if (verificationError) {
    console.error('Error verificando PIN del empleado:', verificationError)
    return NextResponse.json({ error: 'No se pudo verificar el PIN' }, { status: 503 })
  }
  if (verification?.blocked) {
    return NextResponse.json({
      error: 'PIN bloqueado temporalmente',
      blocked: true,
      remaining_minutes: verification.remaining_minutes,
    }, { status: 429 })
  }
  if (verification?.success !== true) {
    return NextResponse.json({
      error: 'PIN incorrecto',
      attempts_remaining: verification?.attempts_remaining,
    }, { status: 401 })
  }

  const employeeResult = await supabaseAdmin
    .from('employees')
    .select('id, name, role')
    .eq('id', employeeId)
    .maybeSingle()
  const employee = employeeResult.data as any
  const employeeError = employeeResult.error

  if (employeeError || !employee || !['admin', 'caja', 'mostrador'].includes(employee.role)) {
    console.error('No se pudo cargar el empleado autenticado:', employeeError)
    return NextResponse.json({ error: 'Empleado no disponible' }, { status: 401 })
  }

  const token = createEmployeeSession({ id: employee.id, name: employee.name, role: employee.role })
  const response = NextResponse.json({ employee })
  response.cookies.set(EMPLOYEE_SESSION_COOKIE, token, employeeSessionCookieOptions)
  response.headers.set('Cache-Control', 'no-store')
  return response
}
