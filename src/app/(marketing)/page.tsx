import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Domora
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Augmentez vos annonces immobilières : visite 3D navigable, conseiller
          IA en aménagement et capture de leads qualifiés.
        </p>
      </div>
      <Button asChild>
        <Link href="/login">Espace agence</Link>
      </Button>
    </main>
  );
}
