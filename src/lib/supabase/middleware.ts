import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and keeps the auth
 * cookies in sync between the request and the response.
 *
 * Runs in the Edge runtime, so it reads the public env vars directly from
 * `process.env` (Next inlines NEXT_PUBLIC_* at build) instead of importing
 * `@/lib/env`, whose server-side schema would not validate at the edge.
 *
 * Route protection itself lives in the (dashboard) layout — this helper only
 * refreshes tokens. Do not add logic between `createServerClient` and
 * `getUser()`: it can cause hard-to-debug session bugs.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}
