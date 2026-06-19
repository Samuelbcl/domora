import { redirect } from "next/navigation";

import { getAuthedProfile } from "@/lib/supabase/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Already signed in → straight to the dashboard.
  const profile = await getAuthedProfile();
  if (profile) redirect("/properties");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Espace agence</CardTitle>
          <CardDescription>
            Connectez-vous pour gérer vos biens et vos leads.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
