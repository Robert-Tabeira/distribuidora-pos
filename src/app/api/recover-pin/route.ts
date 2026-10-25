import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizePhone } from '@/lib/customer-auth'
import { generateTemporaryPassword, hashPassword } from '@/lib/customer-password'

function escapeHtml(value: string): string {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
  return value.replace(/[&<>"']/g, character => entities[character])
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    const cleanPhone = normalizePhone(typeof phone === 'string' ? phone : '')

    if (cleanPhone.length < 8 || cleanPhone.length > 20) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 })
    }

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id,name,email,pin_hash')
      .eq('phone', cleanPhone)
      .maybeSingle()

    if (customerError) throw customerError

    // Nota: para una app de este tamaño priorizamos claridad de UX
    // (avisar si el teléfono no está registrado) por sobre ocultar
    // esa información como se haría en un sistema más sensible.
    if (!customer) {
      return NextResponse.json({ method: 'not_found' })
    }

    if (!customer.email) {
      // Sin email: el frontend va a mostrar el botón de WhatsApp
      return NextResponse.json({ method: 'whatsapp' })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('Falta configurar RESEND_API_KEY en las variables de entorno')
      return NextResponse.json({ error: 'Servicio de email no configurado' }, { status: 500 })
    }

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await hashPassword(temporaryPassword)

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Los Primos <onboarding@resend.dev>',
        to: customer.email,
        subject: 'Recuperación de contraseña - Los Primos',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1e3a8a;">Hola ${escapeHtml(customer.name)} 👋</h2>
            <p>Recibimos un pedido para restablecer tu contraseña.</p>
            <p style="margin: 24px 0; text-align: center;">
              <span style="font-size: 20px; font-weight: bold; overflow-wrap: anywhere; background: #f3f4f6; padding: 12px 24px; border-radius: 8px; display: inline-block;">
                ${temporaryPassword}
              </span>
            </p>
            <p>Usá esta contraseña para entrar y reemplazala por una propia desde Mi cuenta → Datos → Cambiar contraseña.</p>
            <p style="color: #6b7280; font-size: 13px;">Si vos no pediste este cambio, comunicate con el local. Nunca compartas tu contraseña.</p>
          </div>
        `
      })
    })

    if (!emailRes.ok) {
      console.error('Error al enviar recuperación de contraseña:', emailRes.status)
      return NextResponse.json({ error: 'No pudimos enviar el email' }, { status: 500 })
    }

    // Mantener el acceso anterior si falla el envío y evitar pisar un cambio simultáneo.
    const { error: updateError } = await supabase.from('customers')
      .update({ pin_hash: passwordHash }).eq('id', customer.id).eq('pin_hash', customer.pin_hash)
      .select('id').single()
    if (updateError) throw updateError

    return NextResponse.json({ method: 'email' })
  } catch (error) {
    console.error('Error al recuperar contraseña:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
