import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const sameOriginApiFetch: typeof fetch = async (input, init) => {
  if (typeof window === 'undefined') return fetch(input, init)
  const requestUrl = input instanceof Request ? input.url : String(input)
  const url = new URL(requestUrl, window.location.origin)

  // Storage uses the same server-side authorization boundary as PostgREST.
  if (url.origin !== new URL(supabaseUrl).origin) {
    return fetch(input, init)
  }

  const target = `/api/supabase${url.pathname}${url.search}`
  if (input instanceof Request) {
    const proxiedRequest = new Request(new URL(target, window.location.origin), input)
    return fetch(proxiedRequest)
  }
  return fetch(target, { ...init, credentials: 'same-origin' })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: sameOriginApiFetch },
})
