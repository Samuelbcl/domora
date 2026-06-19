"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

type MoveState = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

type NavInfo = { center: THREE.Vector3; radius: number };

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.floor((sorted.length - 1) * p)];
}

function SparkScene({
  url,
  onReady,
}: {
  url: string;
  onReady: (info: NavInfo) => void;
}) {
  const gl = useThree((s) => s.gl);

  // Spark needs an explicit SparkRenderer added to the scene.
  const spark = useMemo(() => new SparkRenderer({ renderer: gl }), [gl]);

  const mesh = useMemo(() => {
    const m = new SplatMesh({ url });
    // Captures from this convention come in flipped 180° around X.
    m.quaternion.set(1, 0, 0, 0);
    return m;
  }, [url]);

  useEffect(() => {
    let active = true;
    const loadable = mesh as unknown as { initialized?: Promise<unknown> };

    const report = () => {
      if (!active) return;
      mesh.updateMatrixWorld(true);
      const mat = mesh.matrixWorld;

      // Robust center/extent from a sample of splat positions, using
      // percentiles so reconstruction "floaters" don't blow up the framing.
      let center = new THREE.Vector3();
      let radius = 1;
      try {
        const packed = mesh as unknown as {
          packedSplats?: { numSplats?: number };
          forEachSplat?: (
            cb: (index: number, c: THREE.Vector3) => void,
          ) => void;
        };
        const num = packed.packedSplats?.numSplats ?? 0;
        const step = num > 0 ? Math.max(1, Math.floor(num / 40000)) : 24;
        const xs: number[] = [];
        const ys: number[] = [];
        const zs: number[] = [];
        const v = new THREE.Vector3();
        packed.forEachSplat?.((index, c) => {
          if (index % step !== 0) return;
          v.copy(c).applyMatrix4(mat);
          xs.push(v.x);
          ys.push(v.y);
          zs.push(v.z);
        });
        if (xs.length > 0) {
          xs.sort((a, b) => a - b);
          ys.sort((a, b) => a - b);
          zs.sort((a, b) => a - b);
          center = new THREE.Vector3(
            percentile(xs, 0.5),
            percentile(ys, 0.5),
            percentile(zs, 0.5),
          );
          const ext = Math.max(
            percentile(xs, 0.95) - percentile(xs, 0.05),
            percentile(ys, 0.95) - percentile(ys, 0.05),
            percentile(zs, 0.95) - percentile(zs, 0.05),
          );
          radius = Math.max(ext * 0.5, 0.001);
        }
      } catch {
        const box = mesh.getBoundingBox(true).applyMatrix4(mat);
        if (!box.isEmpty()) {
          box.getCenter(center);
          radius = Math.max(box.getSize(new THREE.Vector3()).length() * 0.25, 0.001);
        }
      }

      onReady({ center, radius });
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

function FlyControls({
  center,
  radius,
  moveRef,
}: {
  center: THREE.Vector3;
  radius: number;
  moveRef: React.RefObject<MoveState>;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const yaw = useRef(0);
  const pitch = useRef(0);

  // Place the camera inside the scene once it's framed.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.copy(center);
    cam.near = Math.max(radius / 1000, 0.001);
    cam.far = radius * 1000;
    cam.fov = 70;
    cam.updateProjectionMatrix();
    yaw.current = 0;
    pitch.current = 0;
  }, [camera, center, radius]);

  // Drag to look (pointer events cover mouse + touch). Wheel moves forward.
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";
    let dragging = false;
    let px = 0;
    let py = 0;
    let pid = -1;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      px = e.clientX;
      py = e.clientY;
      pid = e.pointerId;
      el.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pid) return;
      yaw.current -= (e.clientX - px) * 0.004;
      pitch.current -= (e.clientY - py) * 0.004;
      const lim = Math.PI / 2 - 0.05;
      pitch.current = Math.max(-lim, Math.min(lim, pitch.current));
      px = e.clientX;
      py = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId === pid) {
        dragging = false;
        pid = -1;
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const fwd = new THREE.Vector3();
      camera.getWorldDirection(fwd);
      camera.position.addScaledVector(fwd, -e.deltaY * radius * 0.001);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [gl, camera, radius]);

  // Keyboard: WASD + ZQSD (AZERTY) + arrows; Space/Shift for up/down.
  useEffect(() => {
    const set = (code: string, val: boolean) => {
      const m = moveRef.current;
      switch (code) {
        case "KeyW":
        case "KeyZ":
        case "ArrowUp":
          m.forward = val;
          break;
        case "KeyS":
        case "ArrowDown":
          m.back = val;
          break;
        case "KeyA":
        case "KeyQ":
        case "ArrowLeft":
          m.left = val;
          break;
        case "KeyD":
        case "ArrowRight":
          m.right = val;
          break;
        case "Space":
          m.up = val;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          m.down = val;
          break;
      }
    };
    const kd = (e: KeyboardEvent) => set(e.code, true);
    const ku = (e: KeyboardEvent) => set(e.code, false);
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [moveRef]);

  useFrame((_, delta) => {
    camera.quaternion.setFromEuler(
      new THREE.Euler(pitch.current, yaw.current, 0, "YXZ"),
    );
    const m = moveRef.current;
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd);
    const right = new THREE.Vector3()
      .crossVectors(fwd, new THREE.Vector3(0, 1, 0))
      .normalize();
    const move = new THREE.Vector3();
    if (m.forward) move.add(fwd);
    if (m.back) move.addScaledVector(fwd, -1);
    if (m.right) move.add(right);
    if (m.left) move.addScaledVector(right, -1);
    if (m.up) move.add(new THREE.Vector3(0, 1, 0));
    if (m.down) move.add(new THREE.Vector3(0, -1, 0));
    if (move.lengthSq() > 0) {
      camera.position.addScaledVector(
        move.normalize(),
        radius * 0.8 * Math.min(delta, 0.05),
      );
    }
  });

  return null;
}

export default function SplatViewer({
  url,
  showStats = false,
}: {
  url: string;
  showStats?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [nav, setNav] = useState<NavInfo | null>(null);
  const moveRef = useRef<MoveState>({
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false,
  });

  useEffect(() => {
    setLoading(true);
    setNav(null);
  }, [url]);

  const handleReady = useCallback((info: NavInfo) => {
    setNav(info);
    setLoading(false);
  }, []);

  const hold = (key: keyof MoveState) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      moveRef.current[key] = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      moveRef.current[key] = false;
    },
    onPointerLeave: () => {
      moveRef.current[key] = false;
    },
  });

  const padBtn =
    "flex size-11 items-center justify-center rounded-md bg-white/15 text-lg text-white backdrop-blur-sm active:bg-white/30 select-none";

  return (
    <div className="relative h-full w-full select-none">
      <Canvas camera={{ position: [0, 0, 0], fov: 70 }} dpr={[1, 2]}>
        <color attach="background" args={["#0a0a0a"]} />
        <SparkScene url={url} onReady={handleReady} />
        {nav && (
          <FlyControls center={nav.center} radius={nav.radius} moveRef={moveRef} />
        )}
        {showStats && <Stats />}
      </Canvas>

      {!loading && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-center text-xs text-white/80">
          Glissez pour regarder · ZQSD / flèches / molette pour vous déplacer
        </div>
      )}

      {/* On-screen movement pad (touch) */}
      {!loading && (
        <div className="absolute bottom-3 left-3 z-10 grid grid-cols-3 gap-1">
          <span />
          <button type="button" aria-label="Avancer" className={padBtn} {...hold("forward")}>
            ▲
          </button>
          <span />
          <button type="button" aria-label="Gauche" className={padBtn} {...hold("left")}>
            ◄
          </button>
          <button type="button" aria-label="Reculer" className={padBtn} {...hold("back")}>
            ▼
          </button>
          <button type="button" aria-label="Droite" className={padBtn} {...hold("right")}>
            ►
          </button>
        </div>
      )}
      {!loading && (
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
          <button type="button" aria-label="Monter" className={padBtn} {...hold("up")}>
            ＋
          </button>
          <button type="button" aria-label="Descendre" className={padBtn} {...hold("down")}>
            －
          </button>
        </div>
      )}

      {loading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white/70">
          Chargement du splat…
        </div>
      )}
    </div>
  );
}
