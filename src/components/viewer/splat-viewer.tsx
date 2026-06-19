"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { SplatMesh } from "@sparkjsdev/spark";

function Splat({ url, onLoaded }: { url: string; onLoaded: () => void }) {
  const mesh = useMemo(() => {
    const m = new SplatMesh({ url });
    // Most captures come in flipped 180° around X — match Spark's defaults.
    m.quaternion.set(1, 0, 0, 0);
    return m;
  }, [url]);

  useEffect(() => {
    let active = true;
    // Spark exposes an `initialized` promise once the splat is decoded.
    const loadable = mesh as unknown as { initialized?: Promise<unknown> };
    if (loadable.initialized && typeof loadable.initialized.then === "function") {
      loadable.initialized
        .then(() => active && onLoaded())
        .catch(() => active && onLoaded());
    } else {
      onLoaded();
    }
    return () => {
      active = false;
      (mesh as unknown as { dispose?: () => void }).dispose?.();
    };
  }, [mesh, onLoaded]);

  return <primitive object={mesh} />;
}

export default function SplatViewer({
  url,
  showStats = false,
}: {
  url: string;
  showStats?: boolean;
}) {
  const [loading, setLoading] = useState(true);

  // Reset loading when the source changes.
  useEffect(() => setLoading(true), [url]);

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={["#0a0a0a"]} />
        <Splat url={url} onLoaded={() => setLoading(false)} />
        <OrbitControls makeDefault enableDamping />
        {showStats && <Stats />}
      </Canvas>

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white/70">
          Chargement du splat…
        </div>
      )}
    </div>
  );
}
