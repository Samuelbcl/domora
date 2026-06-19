"use client";

import { useActionState } from "react";
import Link from "next/link";

import type { Property } from "@/types";
import type { PropertyFormState } from "@/app/(dashboard)/properties/form-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  action: (
    state: PropertyFormState,
    formData: FormData,
  ) => Promise<PropertyFormState>;
  property?: Property;
  submitLabel: string;
};

export function PropertyForm({ action, property, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<
    PropertyFormState,
    FormData
  >(action, {});

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={property?.title ?? ""}
          placeholder="Maison 3 chambres avec jardin"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          name="address"
          defaultValue={property?.address ?? ""}
          placeholder="Rue de la Loi 16, 4000 Liège"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={property?.description ?? ""}
          placeholder="Quelques mots sur le bien…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Statut</Label>
        <Select name="status" defaultValue={property?.status ?? "draft"}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="published">Publié</SelectItem>
            <SelectItem value="archived">Archivé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/properties">Annuler</Link>
        </Button>
      </div>
    </form>
  );
}
