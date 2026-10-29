export async function endStaffSession(): Promise<void> {
  const response = await fetch('/api/staff-session', { method: 'DELETE', credentials: 'same-origin', cache: 'no-store' })
  if (!response.ok) throw new Error('No pudimos cerrar la sesión. Revisá la conexión e intentá de nuevo.')
  try { localStorage.removeItem('employee') } catch { /* The server cookie has already been cleared. */ }
}
