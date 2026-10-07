import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null

// Validar y crear solo cuando una petición real necesita la base. Así Next.js
// puede importar las rutas durante el build sin exigir secretos en esa fase.
export function getSupabaseAdmin() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  }

  // Este cliente solo se usa desde rutas del servidor. Nunca exponer su key.
  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return client
}
