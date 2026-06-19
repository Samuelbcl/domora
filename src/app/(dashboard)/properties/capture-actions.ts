"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAuthedProfile } from "@/lib/supabase/auth";

export type CaptureActionResult = { error?: string };

export async function addCapture(input: {
  propertyId: string;
  splatPath: string;
  format: string;
  fileSizeMb: number;
  roomLabel: string | null;
}): Promise<CaptureActionResult> {
  const profile = await getAuthedProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  // First capture of a property becomes the primary one.
  const { count } = await supabase
    .from("captures")
    .select("id", { count: "exact", head: true })
    .eq("property_id", input.propertyId);

  const { error } = await supabase.from("captures").insert({
    property_id: input.propertyId,
    room_label: input.roomLabel,
    splat_path: input.splatPath,
    format: input.format,
    file_size_mb: input.fileSizeMb,
    is_primary: (count ?? 0) === 0,
  });

  if (error) {
    return { error: "Impossible d'enregistrer la capture." };
  }

  revalidatePath(`/properties/${input.propertyId}`);
  return {};
}

export async function deleteCapture(input: {
  captureId: string;
  propertyId: string;
  splatPath: string;
}): Promise<CaptureActionResult> {
  const profile = await getAuthedProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  await supabase.storage.from("splats").remove([input.splatPath]);
  const { error } = await supabase
    .from("captures")
    .delete()
    .eq("id", input.captureId);

  if (error) {
    return { error: "Impossible de supprimer la capture." };
  }

  revalidatePath(`/properties/${input.propertyId}`);
  return {};
}

export async function setPrimaryCapture(input: {
  captureId: string;
  propertyId: string;
}): Promise<CaptureActionResult> {
  const profile = await getAuthedProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  await supabase
    .from("captures")
    .update({ is_primary: false })
    .eq("property_id", input.propertyId);

  const { error } = await supabase
    .from("captures")
    .update({ is_primary: true })
    .eq("id", input.captureId);

  if (error) {
    return { error: "Impossible de définir la capture principale." };
  }

  revalidatePath(`/properties/${input.propertyId}`);
  return {};
}
