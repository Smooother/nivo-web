import { createClient, type SupabaseClient } from '@supabase/supabase-js'

declare global {
  interface Window {
    __SUPABASE_URL__?: string
    __SUPABASE_ANON_KEY__?: string
    __SUPABASE_CONFIG__?: {
      url?: string
      anonKey?: string
    }
    __env?: Record<string, string | undefined>
  }
}

const importMetaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env ?? {} : {}
const processEnv = typeof process !== 'undefined' ? process.env ?? {} : {}

const readFirstDefined = (values: Array<string | undefined>) =>
  values.find(value => typeof value === 'string' && value.length > 0)

const resolveEnvValue = (
  keys: string[],
  resolveWindowExtras: (win: Window & typeof globalThis) => Array<string | undefined>
) => {
  const win = typeof window !== 'undefined' ? window : undefined
  const candidates: Array<string | undefined> = []

  for (const key of keys) {
    candidates.push(importMetaEnv?.[key])
    candidates.push(processEnv?.[key])
    if (win) {
      candidates.push((win as any)?.[key])
      candidates.push(win.__env?.[key])
    }
  }

  if (win) {
    candidates.push(...resolveWindowExtras(win))
  }

  return readFirstDefined(candidates)
}

const resolvedUrl = resolveEnvValue(
  ['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_URL', 'SUPABASE_URL'],
  win => [win.__SUPABASE_URL__, win.__SUPABASE_CONFIG__?.url]
)

const resolvedAnonKey = resolveEnvValue(
  [
    'VITE_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
    'SUPABASE_PUBLIC_ANON_KEY'
  ],
  win => [win.__SUPABASE_ANON_KEY__, win.__SUPABASE_CONFIG__?.anonKey]
)

export const supabaseConfig = {
  url: resolvedUrl ?? null,
  anonKey: resolvedAnonKey ?? null,
  isConfigured:
    typeof resolvedUrl === 'string' &&
    resolvedUrl.length > 0 &&
    !resolvedUrl.includes('placeholder.supabase.co') &&
    typeof resolvedAnonKey === 'string' &&
    resolvedAnonKey.length > 0 &&
    resolvedAnonKey !== 'public-anon-key'
} as const

let cachedClient: SupabaseClient | null = null
let warnedAboutFallback = false

const createFallbackClient = () => {
  if (!warnedAboutFallback && typeof console !== 'undefined') {
    console.warn(
      '[supabase] Supabase credentials were not found. Using in-memory fallback client; data operations will rely on local fixtures.'
    )
    warnedAboutFallback = true
  }

  return createClient('https://placeholder.supabase.co', 'public-anon-key', {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

const instantiateClient = () => {
  if (supabaseConfig.isConfigured && supabaseConfig.url && supabaseConfig.anonKey) {
    return createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    })
  }

  return createFallbackClient()
}

export const getSupabaseClient = (): SupabaseClient => {
  if (!cachedClient) {
    cachedClient = instantiateClient()
  }

  return cachedClient
}

export const supabase = getSupabaseClient()

export const isSupabaseConfigured = () => supabaseConfig.isConfigured
