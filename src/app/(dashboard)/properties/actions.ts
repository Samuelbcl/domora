"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/supabase/auth";
import { buildUniqueSlug } from "@/lib/slug";
import type { PropertyFormState } from "./form-state";

const propertySchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(200),
  address: z.string().trim().max(300).optional(),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(["draft", "published", "archived"]),
});

function parseForm(formData: FormData) {
  return propertySchema.safeParse({
    title: formData.get("title"),
    address: formData.get("address") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status"),
  });
}

export async function createProperty(
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const profile = await getAuthedProfile();
  if (!profile) redirect("/login");

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { title, address, description, status } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.from("properties").insert({
    agency_id: profile.agency.id,
    slug: buildUniqueSlug(title),
    title,
    address: address ?? null,
    description: description ?? null,
    status,
  });

  if (error) {
    return { error: "Impossible de créer le bien. Réessayez." };
  }

  revalidatePath("/properties");
  redirect("/properties");
}

export async function updateProperty(
  id: string,
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  const profile = await getAuthedProfile();
  if (!profile) redirect("/login");

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { title, address, description, status } = parsed.data;
  const supabase = await createClient();

  // RLS scopes the update to the current agency's rows.
  const { error } = await supabase
    .from("properties")
    .update({
      title,
      address: address ?? null,
      description: description ?? null,
      status,
    })
    .eq("id", id);

  if (error) {
    return { error: "Impossible d'enregistrer les modifications. Réessayez." };
  }

  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
  redirect("/properties");
}

export async function deleteProperty(id: string) {
  const profile = await getAuthedProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  await supabase.from("properties").delete().eq("id", id);

  revalidatePath("/properties");
  redirect("/properties");
}
