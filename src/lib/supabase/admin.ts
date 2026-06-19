import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/**
 * Service-role Supabase client — BYPASSES RLS.
 *
 * Server-only. Use exclusively from Route Handlers / Server Actions that write
 * visitor-generated content (advisor sessions, messages, recommendations,
 * leads). NEVER import this from a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
