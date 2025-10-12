import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database, supabaseConfig } from "./supabase";

type CreateClientOptions = {
  req?: Request;
};

function resolveSupabaseUrl() {
  const env = typeof process !== "undefined" ? process.env : {};
  return (
    import.meta.env.VITE_SUPABASE_URL ||
    env?.NEXT_PUBLIC_SUPABASE_URL ||
    env?.SUPABASE_URL ||
    ""
  );
}

function resolveAnonKey() {
  const env = typeof process !== "undefined" ? process.env : {};
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env?.SUPABASE_ANON_KEY ||
    ""
  );
}

function resolveServiceKey() {
  const env = typeof process !== "undefined" ? process.env : {};
  return (
    env?.SUPABASE_SERVICE_ROLE_KEY ||
    env?.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

const cachedClients = new Map<string, SupabaseClient<Database>>();

export function createServerClient(_options: CreateClientOptions = {}) {
  const url = resolveSupabaseUrl();
  const key = resolveAnonKey();
  const cacheKey = `${url}:${key}:anon`;

  if (!cachedClients.has(cacheKey)) {
    cachedClients.set(
      cacheKey,
      createClient<Database>(url, key, {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    );
  }

  return cachedClients.get(cacheKey)!;
}

export function createAdminClient() {
  const url = resolveSupabaseUrl();
  const serviceKey = resolveServiceKey();
  if (!serviceKey) {
    return null;
  }

  const cacheKey = `${url}:${serviceKey}:service`;
  if (!cachedClients.has(cacheKey)) {
    cachedClients.set(
      cacheKey,
      createClient<Database>(url, serviceKey, {
        auth: {
          persistSession: false,
        },
      })
    );
  }

  return cachedClients.get(cacheKey)!;
}

export async function getUserRole() {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return (user?.user_metadata as { role?: string } | null)?.role ?? "viewer";
  } catch (error) {
    console.error("Failed to resolve Supabase user role", error);
    return "viewer";
  }
}

export function isSupabaseConfigured() {
  return supabaseConfig.isConfigured;
}

