import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { TourSplat } from "@/components/viewer/tour-splat";

// Public, no-auth page. Always rendered fresh so signed URLs stay valid and
// only published properties are ever exposed.
export const dynamic = "force-dynamic";

type PublishedProperty = {
  id: string;
  title: string;
  address: string | null;
};

async function getPublishedProperty(
  slug: string,
): Promise<PublishedProperty | null> {
  // Service-role read, explicitly gated on status = 'published'. No other
  // property data ever reaches an anonymous visitor.
  const admin = createAdminClient();
  const { data } = await admin
    .from("properties")
    .select("id, title, address")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPublishedProperty(slug);
  if (!property) return { title: "Visite indisponible" };
  return {
    title: `${property.title} — visite 3D`,
    description: property.address ?? undefined,
  };
}

export default async function TourPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const property = await getPublishedProperty(slug);
  if (!property) notFound();

  const admin = createAdminClient();
  const { data: capture } = await admin
    .from("captures")
    .select("splat_path")
    .eq("property_id", property.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let splatUrl: string | null = null;
  if (capture?.splat_path) {
    const { data: signed } = await admin.storage
      .from("splats")
      .createSignedUrl(capture.splat_path, 3600);
    splatUrl = signed?.signedUrl ?? null;
  }

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#0a0a0a]">
      {splatUrl ? (
        <TourSplat url={splatUrl} />
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
          La visite 3D de ce bien sera bientôt disponible.
        </div>
      )}

      {/* Overlay header — purely informative, lets touch events pass through. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4 sm:p-6">
        <h1 className="text-lg font-semibold text-white drop-shadow">
          {property.title}
        </h1>
        {property.address && (
          <p className="text-sm text-white/80 drop-shadow">{property.address}</p>
        )}
      </div>
    </main>
  );
}
