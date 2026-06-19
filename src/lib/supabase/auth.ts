import { createClient } from "@/lib/supabase/server";

export type AgencyProfile = {
  id: string;
  fullName: string | null;
  role: "owner" | "agent";
  agency: {
    id: string;
    name: string;
    city: string | null;
    logoUrl: string | null;
  };
};

/**
 * Returns the authenticated user's profile + agency, or null if there is no
 * session OR the user has no linked agency profile.
 *
 * The `profiles` / `agencies` SELECT runs through RLS (`current_agency_id()`),
 * so a successful result is the proof that the multi-tenant guard is wired
 * correctly: a user only ever resolves their own agency.
 */
export async function getAuthedProfile(): Promise<AgencyProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, agencies(id, name, city, logo_url)")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  // The embedded relation may come back as an object or a single-item array
  // depending on how supabase-js infers the FK; normalise both.
  const agency = Array.isArray(data.agencies) ? data.agencies[0] : data.agencies;
  if (!agency) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    role: data.role,
    agency: {
      id: agency.id,
      name: agency.name,
      city: agency.city,
      logoUrl: agency.logo_url,
    },
  };
}
