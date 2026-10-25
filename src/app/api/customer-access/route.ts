import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { normalizePhone, type Customer } from '@/lib/customer-auth'
import { isCustomerOrderingEnabled } from '@/lib/customer-ordering'
import { hashPassword, verifyPassword, isLegacyPasswordHash, passwordValidationError, MAX_PASSWORD_LENGTH } from '@/lib/customer-password'

const PROFILE_FIELDS = 'id,name,business_name,phone,email,created_at,approval_status,pin_hash'

function reply(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

function profile(customer: Customer, needsPasswordUpgrade = false): Customer {
  return {
    id: customer.id, name: customer.name, business_name: customer.business_name,
    phone: customer.phone, email: customer.email, created_at: customer.created_at,
    approval_status: customer.approval_status, needs_password_upgrade: needsPasswordUpgrade,
  }
}

export async function POST(request: NextRequest) {
  let input: Record<string, unknown>
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'Solicitud inválida' }, 400)
    input = body
  } catch {
    return reply({ error: 'Solicitud inválida' }, 400)
  }

  try {
    if (!await isCustomerOrderingEnabled()) return reply({ error: 'El acceso de clientes no está disponible en este momento' }, 403)
    const password = typeof input.password === 'string' ? input.password : ''
    if (!password || password.length > MAX_PASSWORD_LENGTH) return reply({ error: 'Ingresá una contraseña válida' }, 400)

    if (input.action === 'register') {
      const phone = normalizePhone(typeof input.phone === 'string' ? input.phone : '')
      const name = typeof input.name === 'string' ? input.name.trim() : ''
      const businessName = typeof input.business_name === 'string' ? input.business_name.trim() : ''
      const email = typeof input.email === 'string' ? input.email.trim() : ''
      if (!name || !businessName || phone.length < 8 || phone.length > 20) return reply({ error: 'Completá tu nombre, comercio y teléfono válido' }, 400)
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: 'Ingresá un correo válido o dejalo vacío' }, 400)
      const validationError = passwordValidationError(password)
      if (validationError) return reply({ error: validationError }, 400)
      const { error } = await supabase.from('customers').insert({
        name, business_name: businessName, phone, email: email || null,
        pin_hash: await hashPassword(password), approval_status: 'pending',
      })
      if (error?.code === '23505') return reply({ error: 'Ya existe una cuenta con ese teléfono. Iniciá sesión en vez de registrarte.' }, 409)
      if (error) throw error
      return reply({ success: true }, 201)
    }

    if (input.action === 'login') {
      const phone = normalizePhone(typeof input.phone === 'string' ? input.phone : '')
      if (phone.length < 8 || phone.length > 20) return reply({ error: 'Teléfono o contraseña incorrectos' }, 401)
      const { data: customer, error } = await supabase.from('customers').select(PROFILE_FIELDS).eq('phone', phone).maybeSingle()
      if (error) throw error
      if (!customer || typeof customer.pin_hash !== 'string' || !await verifyPassword(password, customer.pin_hash)) return reply({ error: 'Teléfono o contraseña incorrectos' }, 401)
      if (customer.approval_status !== 'approved') return reply({ error: customer.approval_status === 'rejected'
        ? 'La solicitud de acceso de este comercio no fue aprobada. Comunicate con Distribuidora Los Primos.'
        : 'La solicitud de este comercio está pendiente de revisión y confirmación del local. La respuesta puede demorar hasta 24 horas.' }, 403)
      await supabase.from('customers').update({ last_login_at: new Date().toISOString() }).eq('id', customer.id)
      return reply({ customer: profile(customer, isLegacyPasswordHash(customer.pin_hash)) })
    }

    if (input.action === 'change-password') {
      const id = typeof input.customer_id === 'string' ? input.customer_id : ''
      const currentPassword = typeof input.current_password === 'string' ? input.current_password : ''
      if (!id || !currentPassword || currentPassword.length > MAX_PASSWORD_LENGTH) return reply({ error: 'Ingresá tu contraseña actual o tu código anterior' }, 400)
      const validationError = passwordValidationError(password)
      if (validationError) return reply({ error: validationError }, 400)
      if (password === currentPassword) return reply({ error: 'Elegí una contraseña diferente de la actual' }, 400)
      const { data: customer, error } = await supabase.from('customers').select(PROFILE_FIELDS).eq('id', id).maybeSingle()
      if (error) throw error
      if (!customer || typeof customer.pin_hash !== 'string' || !await verifyPassword(currentPassword, customer.pin_hash)) return reply({ error: 'Tu contraseña actual no es correcta' }, 401)
      if (customer.approval_status !== 'approved') return reply({ error: 'La cuenta requiere la aprobación del local' }, 403)
      const { error: updateError } = await supabase.from('customers').update({ pin_hash: await hashPassword(password) })
        .eq('id', customer.id).eq('pin_hash', customer.pin_hash).select('id').single()
      if (updateError) throw updateError
      return reply({ customer: profile(customer) })
    }

    return reply({ error: 'Acción inválida' }, 400)
  } catch {
    console.error('No se pudo completar una operación de acceso de clientes')
    return reply({ error: 'No pudimos completar la solicitud. Intentá de nuevo.' }, 500)
  }
}
