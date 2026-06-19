import Link from "next/link";

import type { Property } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<Property["status"], string> = {
  draft: "Brouillon",
  published: "Publié",
  archived: "Archivé",
};

export default async function PropertiesPage() {
  const supabase = await createClient();
  // RLS scopes this to the current agency.
  const { data: properties } = await supabase
    .from("properties")
    .select("id, slug, title, address, status, created_at")
    .order("created_at", { ascending: false });

  const rows = (properties ?? []) as Pick<
    Property,
    "id" | "slug" | "title" | "address" | "status" | "created_at"
  >[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Biens</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos annonces et leur statut de publication.
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/new">Nouveau bien</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aucun bien pour l&apos;instant.
          </p>
          <Button asChild className="mt-4">
            <Link href="/properties/new">Créer votre premier bien</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden md:table-cell">Adresse</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        p.status === "published" ? "default" : "secondary"
                      }
                    >
                      {STATUS_LABELS[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {p.address ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/properties/${p.id}`}>Éditer</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
