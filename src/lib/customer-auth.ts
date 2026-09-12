// Utilidades compartidas para el login/registro de clientes.
// El PIN nunca se guarda en texto plano: se hashea con SHA-256 (nativo
// del navegador, sin instalar nada) antes de mandarlo a Supabase.

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Deja el teléfono solo con dígitos, para que "099 123 456" y
// "099-123-456" se guarden/busquen siempre igual.
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  created_at: string
}

const STORAGE_KEY = 'customer'

export function saveCustomerSession(customer: Customer) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customer))
}

export function getCustomerSession(): Customer | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as Customer
  } catch {
    return null
  }
}

export function clearCustomerSession() {
  localStorage.removeItem(STORAGE_KEY)
}
