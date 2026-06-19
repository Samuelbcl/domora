"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

function SparkScene({
  url,
  onReady,
}: {
  url: string;
  onReady: (box: THREE.Box3) => void;
}) {
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
    const report = () => {
      if (!active) return;
      mesh.updateMatrixWorld(true);
      // Bounding box of the splat centers, in world space (accounts for flip).
      const box = mesh.getBoundingBox(true).applyMatrix4(mesh.matrixWorld);
      onReady(box);
    };
    if (loadable.initialized?.then) {
      loadable.initialized.then(report).catch(report);
    } else {
      report();
    }
    return () => {
      active = false;
      (mesh as unknown as { dispose?: () => void }).dispose?.();
    };
  }, [mesh, onReady]);

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
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => setLoading(true), [url]);

  // Frame the camera + orbit target on the actual splat center so navigation
  // rotates around the model instead of swinging it out of view.
  const handleReady = useCallback((box: THREE.Box3) => {
    setLoading(false);
    const controls = controlsRef.current;
    if (!controls || box.isEmpty()) return;

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const dist = maxDim * 1.8;

    const camera = controls.object as THREE.PerspectiveCamera;
    controls.target.copy(center);
    camera.position.set(center.x, center.y, center.z + dist);
    camera.near = Math.max(dist / 100, 0.001);
    camera.far = dist * 100;
    camera.updateProjectionMatrix();
    controls.update();
  }, []);

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 2]}>
        <color attach="background" args={["#0a0a0a"]} />
        <SparkScene url={url} onReady={handleReady} />
        <OrbitControls ref={controlsRef} makeDefault enableDamping />
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
