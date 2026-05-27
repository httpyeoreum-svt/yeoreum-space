import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client.
 * Use inside Server Components, Route Handlers, and Server Actions.
 *
 * The cookie store is wired up so any auth session (set by the admin app or
 * a future login flow here) is read correctly. Writes are wrapped in try/catch
 * because Server Components can't actually mutate cookies — the middleware
 * is responsible for refreshing the session cookie when it expires.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component context — middleware will handle session refresh.
          }
        },
      },
    },
  );
}
