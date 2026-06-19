import { PropertyForm } from "@/components/dashboard/property-form";
import { createProperty } from "../actions";

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau bien</h1>
        <p className="text-sm text-muted-foreground">
          Un slug public est généré automatiquement à la création.
        </p>
      </div>

      <PropertyForm action={createProperty} submitLabel="Créer le bien" />
    </div>
  );
}
