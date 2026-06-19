import { notFound } from "next/navigation";

import type { Property } from "@/types";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { PropertyForm } from "@/components/dashboard/property-form";
import {
  CaptureManager,
  type CaptureView,
} from "@/components/dashboard/capture-manager";
import { Button } from "@/components/ui/button";
import { updateProperty, deleteProperty } from "../actions";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  // RLS ensures only the owning agency can read this row.
  const { data } = await supabase
    .from("properties")
    .select(
      "id, agency_id, slug, title, address, description, status, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const property = data as Property;
  const publicUrl = `${env.NEXT_PUBLIC_APP_URL}/tour/${property.slug}`;
  const updateAction = updateProperty.bind(null, property.id);
  const deleteAction = deleteProperty.bind(null, property.id);

  // Captures + short-lived signed URLs (private bucket).
  const { data: captureRows } = await supabase
    .from("captures")
    .select("id, room_label, splat_path, format, file_size_mb, is_primary")
    .eq("property_id", property.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  const captures: CaptureView[] = await Promise.all(
    (captureRows ?? []).map(async (c) => {
      const { data: signed } = await supabase.storage
        .from("splats")
        .createSignedUrl(c.splat_path, 3600);
      return { ...c, url: signed?.signedUrl ?? null };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Éditer le bien
        </h1>
        <p className="text-sm text-muted-foreground">
          URL publique :{" "}
          {property.status === "published" ? (
            <a
              href={publicUrl}
              className="underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              {publicUrl}
            </a>
          ) : (
            <span className="font-mono">{publicUrl}</span>
          )}
          {property.status !== "published" && (
            <span className="ml-1">(visible une fois publié)</span>
          )}
        </p>
      </div>

      <PropertyForm
        action={updateAction}
        property={property}
        submitLabel="Enregistrer"
      />

      <section className="space-y-3 border-t pt-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Visite 3D (splat)
          </h2>
          <p className="text-sm text-muted-foreground">
            Uploadez le fichier splat du bien et vérifiez la fluidité de la
            navigation, idéalement sur un smartphone.
          </p>
        </div>
        <CaptureManager
          propertyId={property.id}
          agencyId={property.agency_id}
          captures={captures}
        />
      </section>

      <div className="max-w-xl border-t pt-6">
        <h2 className="text-sm font-medium">Zone de danger</h2>
        <p className="mb-3 mt-1 text-sm text-muted-foreground">
          La suppression est définitive et retire toutes les données liées.
        </p>
        <form action={deleteAction}>
          <Button type="submit" variant="destructive" size="sm">
            Supprimer ce bien
          </Button>
        </form>
      </div>
    </div>
  );
}
