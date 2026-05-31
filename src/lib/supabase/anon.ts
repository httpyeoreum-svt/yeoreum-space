import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-less anonymous Supabase client for cached PUBLIC reads.
 *
 * The cookie-bound server client (./server) cannot be used inside
 * `unstable_cache` scopes — reading cookies there is unsupported. Every
 * public-site read is anon-readable via RLS, so this client returns identical
 * data without touching the request's cookies, making it safe to cache the
 * result across requests.
 */
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
