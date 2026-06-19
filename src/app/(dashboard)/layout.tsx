import { redirect } from "next/navigation";

import { getAuthedProfile } from "@/lib/supabase/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Button } from "@/components/ui/button";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth + multi-tenant guard. No session or no agency profile → login.
  const profile = await getAuthedProfile();
  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex w-full flex-col border-b bg-card p-4 md:w-64 md:border-r md:border-b-0">
        <div className="mb-6">
          <p className="text-xs font-medium text-muted-foreground">Domora</p>
          <p className="truncate text-sm font-semibold">{profile.agency.name}</p>
        </div>

        <DashboardNav />

        <div className="mt-auto pt-6">
          <p className="mb-2 truncate text-xs text-muted-foreground">
            {profile.fullName ?? "Compte"} · {profile.role}
          </p>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              Se déconnecter
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
