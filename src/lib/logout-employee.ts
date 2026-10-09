'use client'

export async function logoutEmployee() {
  try {
    await fetch('/api/session/logout', { method: 'POST', credentials: 'same-origin' })
  } finally {
    localStorage.removeItem('employee')
  }
}
