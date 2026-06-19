import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Browser Supabase client (anon key, RLS enforced).
 * Use inside Client Components only.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
