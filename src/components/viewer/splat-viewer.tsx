"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

function SparkScene({ url, onLoaded }: { url: string; onLoaded: () => void }) {
  const gl = useThree((s) => s.gl);

  // Spark requires an explicit SparkRenderer added to the scene.
  const spark = useMemo(() => new SparkRenderer({ renderer: gl }), [gl]);

  const mesh = useMemo(() => {
    const m = new SplatMesh({ url });
    // Captures usually come in flipped 180° around X.
    m.quaternion.set(1, 0, 0, 0);
    return m;
  }, [url]);

  useEffect(() => {
    let active = true;
    const loadable = mesh as unknown as { initialized?: Promise<unknown> };
    if (loadable.initialized?.then) {
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

  return (
    <>
      <primitive object={spark} />
      <primitive object={mesh} />
    </>
  );
}

export default function SplatViewer({
  url,
  showStats = false,
}: {
  url: string;
  showStats?: boolean;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => setLoading(true), [url]);

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={["#0a0a0a"]} />
        <SparkScene url={url} onLoaded={() => setLoading(false)} />
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
