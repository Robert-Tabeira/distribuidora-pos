'use client'

export async function logoutEmployee() {
  try {
    await fetch('/api/session/logout', { method: 'POST', credentials: 'same-origin' })
  } finally {
    localStorage.removeItem('employee')
    localStorage.removeItem('employee_last_activity')
    window.dispatchEvent(new Event('employee-session-ended'))
  }
}
