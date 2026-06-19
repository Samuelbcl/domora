"use client";

import dynamic from "next/dynamic";

const SplatViewer = dynamic(() => import("./splat-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-white/60">
      Chargement de la visite…
    </div>
  ),
});

export function TourSplat({ url }: { url: string }) {
  return (
    <div className="h-full w-full">
      <SplatViewer url={url} />
    </div>
  );
}
