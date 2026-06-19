import { notFound } from "next/navigation";

import type { Property } from "@/types";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { PropertyForm } from "@/components/dashboard/property-form";
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
