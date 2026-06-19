"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
  addCapture,
  deleteCapture,
  setPrimaryCapture,
} from "@/app/(dashboard)/properties/capture-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const ACCEPTED_EXT = ["spz", "splat", "ksplat", "ply", "sog"];

const SplatViewer = dynamic(() => import("@/components/viewer/splat-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-white/60">
      Initialisation du viewer…
    </div>
  ),
});

export type CaptureView = {
  id: string;
  room_label: string | null;
  splat_path: string;
  format: string | null;
  file_size_mb: number | null;
  is_primary: boolean;
  url: string | null;
};

export function CaptureManager({
  propertyId,
  agencyId,
  captures,
}: {
  propertyId: string;
  agencyId: string;
  captures: CaptureView[];
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    captures.find((c) => c.is_primary)?.id ?? captures[0]?.id ?? null,
  );

  const selected = useMemo(
    () => captures.find((c) => c.id === selectedId) ?? null,
    [captures, selectedId],
  );

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const roomInput = form.elements.namedItem("room") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError("Choisissez un fichier splat.");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXT.includes(ext)) {
      setError(`Format non supporté. Acceptés : ${ACCEPTED_EXT.join(", ")}.`);
      return;
    }

    setUploading(true);
    const path = `${agencyId}/${propertyId}/${crypto.randomUUID()}.${ext}`;
    const supabase = createClient();

    const { error: upErr } = await supabase.storage
      .from("splats")
      .upload(path, file, { upsert: false });

    if (upErr) {
      setError("Échec de l'upload vers le stockage.");
      setUploading(false);
      return;
    }

    const res = await addCapture({
      propertyId,
      splatPath: path,
      format: ext,
      fileSizeMb: Number((file.size / 1024 / 1024).toFixed(2)),
      roomLabel: roomInput.value.trim() || null,
    });

    setUploading(false);
    if (res.error) {
      setError(res.error);
      return;
    }

    form.reset();
    router.refresh();
  }

  async function onDelete(c: CaptureView) {
    setError(null);
    const res = await deleteCapture({
      captureId: c.id,
      propertyId,
      splatPath: c.splat_path,
    });
    if (res.error) {
      setError(res.error);
      return;
    }
    if (selectedId === c.id) setSelectedId(null);
    router.refresh();
  }

  async function onSetPrimary(c: CaptureView) {
    setError(null);
    const res = await setPrimaryCapture({ captureId: c.id, propertyId });
    if (res.error) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video w-full overflow-hidden rounded-lg border bg-[#0a0a0a]">
        {selected?.url ? (
          <SplatViewer url={selected.url} showStats={showStats} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/60">
            {captures.length === 0
              ? "Aucune capture. Uploadez un fichier splat pour prévisualiser."
              : "Sélectionnez une capture à prévisualiser."}
          </div>
        )}
      </div>

      {selected?.url && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showStats}
            onChange={(e) => setShowStats(e.target.checked)}
          />
          Afficher le compteur FPS (validation perf mobile)
        </label>
      )}

      <form onSubmit={onUpload} className="space-y-3 rounded-lg border p-4">
        <p className="text-sm font-medium">Ajouter une capture</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="file">Fichier splat</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".spz,.splat,.ksplat,.ply,.sog"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="room">Pièce (optionnel)</Label>
            <Input id="room" name="room" placeholder="Salon, cuisine…" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Formats acceptés : {ACCEPTED_EXT.join(", ")}. Privilégiez un fichier
          compressé et léger pour la fluidité sur mobile.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={uploading}>
          {uploading ? "Upload en cours…" : "Uploader"}
        </Button>
      </form>

      {captures.length > 0 && (
        <ul className="divide-y rounded-lg border">
          {captures.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 p-3"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {c.room_label ?? "Capture"}
                  {c.is_primary && <Badge variant="default">Principale</Badge>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.format ?? "?"}
                  {c.file_size_mb != null && ` · ${c.file_size_mb} Mo`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedId(c.id)}
                  disabled={!c.url}
                >
                  Voir
                </Button>
                {!c.is_primary && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onSetPrimary(c)}
                  >
                    Définir principale
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(c)}
                >
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
