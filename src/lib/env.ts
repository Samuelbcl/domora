import { z } from "zod";

/**
 * Env validation (zod) — validated at boot.
 *
 * Two schemas:
 *  - `clientSchema` : NEXT_PUBLIC_* only. Safe to expose to the browser.
 *  - `serverSchema` : secrets. NEVER imported into a Client Component.
 *
 * Variables not yet needed in step 1 (Anthropic, restyle, Resend) are marked
 * `.optional()` so the app boots with only Supabase configured. They become
 * effectively required at their respective build steps (6 / 7 / 9).
 */

// ---------------------------------------------------------------------------
// Client (browser-safe) — must be referenced statically so Next can inline them
// ---------------------------------------------------------------------------
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
});

const clientValues = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

// Treat empty strings (e.g. `FOO=` in .env) as "not set" for optional vars.
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

// ---------------------------------------------------------------------------
// Server (secrets) — parsed only on the server
// ---------------------------------------------------------------------------
const serverSchema = z.object({
  // Supabase service role — bypasses RLS. Server only.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Anthropic — agent IA (step 6). Model from env, never hardcoded.
  ANTHROPIC_API_KEY: optional(z.string().min(1)),
  ANTHROPIC_MODEL: optional(z.string().min(1)),

  // Restyle 2D provider (step 7) — abstracted behind RestyleProvider.
  RESTYLE_PROVIDER: optional(z.enum(["fal", "replicate"])),
  FAL_KEY: optional(z.string().min(1)),
  REPLICATE_API_TOKEN: optional(z.string().min(1)),

  // Resend — lead notification emails (step 9).
  RESEND_API_KEY: optional(z.string().min(1)),
  RESEND_FROM_EMAIL: optional(z.email()),
  LEADS_NOTIFICATION_EMAIL: optional(z.email()),
});

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

const parsedClient = clientSchema.safeParse(clientValues);
if (!parsedClient.success) {
  throw new Error(
    `❌ Invalid public environment variables:\n${formatIssues(parsedClient.error)}`,
  );
}

const isServer = typeof window === "undefined";

let serverEnv: z.infer<typeof serverSchema> = {} as z.infer<typeof serverSchema>;
if (isServer) {
  const parsedServer = serverSchema.safeParse(process.env);
  if (!parsedServer.success) {
    throw new Error(
      `❌ Invalid server environment variables:\n${formatIssues(parsedServer.error)}`,
    );
  }
  serverEnv = parsedServer.data;
}

export const env = {
  ...parsedClient.data,
  ...serverEnv,
};

export type Env = typeof env;
