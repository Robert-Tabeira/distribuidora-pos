import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPin, normalizePhone } from '@/lib/customer-auth'

function generateTempPin() {
  return Math.floor(1000 + Math.random() * 9000).toString() // 4 dígitos
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()
    const cleanPhone = normalizePhone(phone || '')

    if (!cleanPhone) {
      return NextResponse.json({ error: 'Teléfono inválido' }, { status: 400 })
    }

    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', cleanPhone)
      .single()

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

    // Con email: generamos un código temporal y lo mandamos por mail
    const tempPin = generateTempPin()
    const pinHash = await hashPin(tempPin)

    const { error: updateError } = await supabase
      .from('customers')
      .update({ pin_hash: pinHash })
      .eq('id', customer.id)

    if (updateError) throw updateError

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.error('Falta configurar RESEND_API_KEY en las variables de entorno')
      return NextResponse.json({ error: 'Servicio de email no configurado' }, { status: 500 })
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Los Primos <onboarding@resend.dev>',
        to: customer.email,
        subject: 'Tu nuevo código de acceso - Los Primos',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1e3a8a;">Hola ${customer.name} 👋</h2>
            <p>Recibimos un pedido para restablecer tu código de acceso.</p>
            <p style="margin: 24px 0; text-align: center;">
              <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; background: #f3f4f6; padding: 12px 24px; border-radius: 8px; display: inline-block;">
                ${tempPin}
              </span>
            </p>
            <p>Usalo para entrar y, si querés, después lo podés cambiar.</p>
            <p style="color: #6b7280; font-size: 13px;">Si vos no pediste esto, podés ignorar este mensaje.</p>
          </div>
        `
      })
    })

    if (!emailRes.ok) {
      const errBody = await emailRes.text()
      console.error('Error al enviar email con Resend:', errBody)
      return NextResponse.json({ error: 'No pudimos enviar el email' }, { status: 500 })
    }

    return NextResponse.json({ method: 'email' })
  } catch (error) {
    console.error('Error en recover-pin:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
