export const MIN_PASSWORD_LENGTH = 12
export const MAX_PASSWORD_LENGTH = 128
export const PASSWORD_HELP = 'Usá entre 12 y 128 caracteres, incluyendo letras y números. Podés agregar espacios y símbolos.'

const ITERATIONS = 600_000
const FORMAT = 'pbkdf2_sha256'

export function passwordValidationError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) return PASSWORD_HELP
  if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(password) || !/\d/.test(password)) return 'La contraseña debe incluir al menos una letra y un número.'
  return null
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/.{2}/g) || [], byte => parseInt(byte, 16))
}

async function derivePassword(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(salt), iterations: ITERATIONS }, key, 256)
  return toHex(new Uint8Array(bits))
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `${FORMAT}$${ITERATIONS}$${toHex(salt)}$${await derivePassword(password, salt)}`
}

export function isLegacyPasswordHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash)
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || password.length > MAX_PASSWORD_LENGTH) return false
  let expected: string
  let actual: string
  if (isLegacyPasswordHash(storedHash)) {
    // Solo para que las cuentas existentes puedan entrar y reemplazar su PIN.
    actual = toHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))))
    expected = storedHash.toLowerCase()
  } else {
    const parts = storedHash.split('$')
    if (parts.length !== 4 || parts[0] !== FORMAT || parts[1] !== String(ITERATIONS) || !/^[a-f0-9]{32}$/.test(parts[2]) || !/^[a-f0-9]{64}$/.test(parts[3])) return false
    actual = await derivePassword(password, fromHex(parts[2]))
    expected = parts[3]
  }
  let difference = actual.length ^ expected.length
  for (let index = 0; index < expected.length; index++) difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index)
  return difference === 0
}

export function generateTemporaryPassword(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
  const random = crypto.getRandomValues(new Uint8Array(20))
  return `Aa1!${Array.from(random, byte => alphabet[byte & 63]).join('')}`
}
