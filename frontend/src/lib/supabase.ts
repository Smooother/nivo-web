import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const PUBLIC_SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.PUBLIC_SUPABASE_URL

const PUBLIC_SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY

let cachedClient: SupabaseClient | null = null

const createFallbackClient = () =>
  createClient('https://placeholder.supabase.co', 'public-anon-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })

export const getSupabaseClient = (): SupabaseClient => {
  if (cachedClient) {
    return cachedClient
  }

  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[supabase] Missing Supabase URL or anonymous key environment variables. Falling back to a placeholder client.'
      )
    }
    cachedClient = createFallbackClient()
    return cachedClient
  }

  cachedClient = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  })

  return cachedClient
}

export const supabase = getSupabaseClient()
