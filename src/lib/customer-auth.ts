// Utilidades compartidas para la sesión y el registro de clientes.

// Deja el teléfono solo con dígitos, para que "099 123 456" y
// "099-123-456" se guarden/busquen siempre igual.
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export interface Customer {
  id: string
  name: string
  business_name?: string | null
  phone: string
  email: string | null
  created_at: string
  approval_status?: 'pending' | 'approved' | 'rejected'
  needs_password_upgrade?: boolean
}

const STORAGE_KEY = 'customer'

export function saveCustomerSession(customer: Customer) {
  // Las consultas de clientes pueden incluir campos privados: no persistir hashes.
  const session: Customer = {
    id: customer.id, name: customer.name, business_name: customer.business_name,
    phone: customer.phone, email: customer.email, created_at: customer.created_at,
    approval_status: customer.approval_status, needs_password_upgrade: customer.needs_password_upgrade,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function getCustomerSession(): Customer | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const session = JSON.parse(stored) as Customer & { pin_hash?: string }
    if (session.pin_hash) {
      delete session.pin_hash
      saveCustomerSession(session)
    }
    return session
  } catch {
    return null
  }
}

export function clearCustomerSession() {
  localStorage.removeItem(STORAGE_KEY)
}
