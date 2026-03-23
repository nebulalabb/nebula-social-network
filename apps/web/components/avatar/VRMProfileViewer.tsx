"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Stars } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils, VRMExpressionPresetName } from "@pixiv/three-vrm";
import type { AnimState, EmotionState } from "../room/VRMAvatar";
import { cn } from "../../lib/utils";

// ── Emotion / Pose / BG config ────────────────────────────────────────────────
const EMOTIONS: { value: EmotionState; emoji: string; label: string }[] = [
  { value: "neutral",   emoji: "😐", label: "Bình thường" },
  { value: "happy",     emoji: "😊", label: "Vui" },
  { value: "sad",       emoji: "😢", label: "Buồn" },
  { value: "angry",     emoji: "😠", label: "Tức" },
  { value: "surprised", emoji: "😲", label: "Ngạc nhiên" },
  { value: "relaxed",   emoji: "😌", label: "Thư giãn" },
];

const POSES: { value: AnimState; emoji: string; label: string }[] = [
  { value: "idle", emoji: "🧍", label: "Đứng" },
  { value: "wave", emoji: "👋", label: "Vẫy tay" },
  { value: "dance", emoji: "💃", label: "Nhảy" },
  { value: "bow",  emoji: "🙇", label: "Cúi chào" },
];

const BACKGROUNDS = [
  { value: "dark",  label: "Tối",  class: "bg-slate-950" },
  { value: "pink",  label: "Hồng", class: "bg-gradient-to-b from-pink-950 to-purple-950" },
  { value: "blue",  label: "Xanh", class: "bg-gradient-to-b from-blue-950 to-indigo-950" },
  { value: "stars", label: "Sao",  class: "bg-slate-950" },
];

const EMOTION_MAP: Partial<Record<EmotionState, Partial<Record<string, number>>>> = {
  happy:     { happy: 0.8 },
  sad:       { sad: 0.8 },
  angry:     { angry: 0.8 },
  surprised: { surprised: 0.9 },
  relaxed:   { relaxed: 0.7 },
};

// ── VRM scene — self-contained loader + camera fit ────────────────────────────
function VRMScene({
  url,
  animation,
  emotion,
  showStars,
}: {
  url: string;
  animation: AnimState;
  emotion: EmotionState;
  showStars: boolean;
}) {
  const groupRef    = useRef<THREE.Group>(null);
  const vrmRef      = useRef<VRM | null>(null);
  const controlsRef = useRef<any>(null);
  const elapsedRef  = useRef(0);
  const blinkTimer  = useRef(0);
  const blinkVal    = useRef(0);
  const mouseRef    = useRef({ x: 0, y: 0 });
  const headTarget  = useRef({ x: 0, y: 0 });
  const fitted      = useRef(false);
  const { camera, gl } = useThree();

  // Mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [gl]);

  // Load VRM
  useEffect(() => {
    let cancelled = false;
    fitted.current = false;
    // Clear previous
    if (vrmRef.current && groupRef.current) {
      groupRef.current.remove(vrmRef.current.scene);
      vrmRef.current = null;
    }
    const loader = new GLTFLoader();
    loader.register((p) => new VRMLoaderPlugin(p));
    loader.load(url, (gltf) => {
      if (cancelled) return;
      const vrm = gltf.userData.vrm as VRM;
      if (!vrm) return;
      VRMUtils.removeUnnecessaryVertices(vrm.scene);
      VRMUtils.combineSkeletons(vrm.scene);
      VRMUtils.rotateVRM0(vrm);
      vrmRef.current = vrm;
      groupRef.current?.add(vrm.scene);
    }, undefined, (err) => console.error("VRM load error:", err));
    return () => {
      cancelled = true;
      if (vrmRef.current && groupRef.current) {
        groupRef.current.remove(vrmRef.current.scene);
        vrmRef.current = null;
      }
    };
  }, [url]);

  useFrame((_, delta) => {
    const vrm = vrmRef.current;

    // Camera auto-fit — retry until model is loaded and has geometry
    if (!fitted.current && groupRef.current && groupRef.current.children.length > 0) {
      const box = new THREE.Box3().setFromObject(groupRef.current);
      if (!box.isEmpty()) {
        const center = new THREE.Vector3();
        const size   = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);
        const cam    = camera as THREE.PerspectiveCamera;
        const fovRad = (cam.fov * Math.PI) / 180;
        const distH  = (size.y / 2) / Math.tan(fovRad / 2);
        const distW  = (size.x / 2) / (Math.tan(fovRad / 2) * cam.aspect);
        const dist   = Math.max(distH, distW) * 1.2;
        cam.position.set(center.x, center.y, center.z + dist);
        cam.lookAt(center);
        if (controlsRef.current) {
          controlsRef.current.target.copy(center);
          controlsRef.current.update();
        }
        fitted.current = true;
      }
    }

    if (!vrm) return;
    elapsedRef.current += delta;
    const t = elapsedRef.current;
    vrm.update(delta);

    // Blink
    blinkTimer.current += delta;
    if (blinkTimer.current > 3.5 + Math.random() * 2) { blinkTimer.current = 0; blinkVal.current = 1; }
    if (blinkVal.current > 0) blinkVal.current = Math.max(0, blinkVal.current - delta * 8);

    if (vrm.expressionManager) {
      try {
        vrm.expressionManager.setValue(VRMExpressionPresetName.Blink, blinkVal.current);
        const exprs = EMOTION_MAP[emotion] ?? {};
        ["happy","sad","angry","surprised","relaxed"].forEach((k) => {
          try { vrm.expressionManager!.setValue(k as any, (exprs as any)[k] ?? 0); } catch {}
        });
      } catch {}
    }

    // Mouse head tracking
    headTarget.current.x = THREE.MathUtils.lerp(headTarget.current.x, mouseRef.current.y * 0.25, 0.04);
    headTarget.current.y = THREE.MathUtils.lerp(headTarget.current.y, mouseRef.current.x * 0.35, 0.04);
    const head = vrm.humanoid?.getNormalizedBoneNode("head");
    if (head) {
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, headTarget.current.x, 0.1);
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, headTarget.current.y, 0.1);
    }

    // Idle breathing
    const spine = vrm.humanoid?.getNormalizedBoneNode("spine");
    if (spine) spine.rotation.x = Math.sin(t * 1.4) * 0.01;

    // Simple pose animations
    const h = vrm.humanoid;
    if (!h) return;
    const lerp = (node: THREE.Object3D | null, axis: "x"|"y"|"z", target: number) => {
      if (!node) return;
      (node.rotation as any)[axis] = THREE.MathUtils.lerp((node.rotation as any)[axis], target, delta * 6);
    };
    const lArm = h.getNormalizedBoneNode("leftUpperArm");
    const rArm = h.getNormalizedBoneNode("rightUpperArm");
    const hips = h.getNormalizedBoneNode("hips");

    switch (animation) {
      case "idle":
        lerp(lArm, "z", 0.3); lerp(rArm, "z", -0.3);
        break;
      case "wave":
        lerp(rArm, "x", -1.2);
        lerp(rArm, "z", -0.3 + Math.sin(t * 7) * 0.4);
        lerp(lArm, "z", 0.2);
        break;
      case "dance":
        if (hips) hips.rotation.y = Math.sin(t * 3.5) * 0.3;
        lerp(lArm, "x", Math.sin(t * 3.5) * 0.8);
        lerp(rArm, "x", -Math.sin(t * 3.5) * 0.8);
        break;
      case "bow":
        if (spine) spine.rotation.x = Math.min(0.6, t * 1.5);
        break;
    }
  });

  return (
    <>
      {showStars && <Stars radius={50} depth={30} count={800} factor={3} saturation={0.5} fade />}
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 4, 2]} intensity={2.5} color="#fff5e0" />
      <directionalLight position={[-2, 3, -1]} intensity={0.6} color="#a5b4fc" />
      <pointLight position={[0, 2, 1.5]} intensity={0.8} color="#f9a8d4" />
      <group ref={groupRef} />
      <ContactShadows position={[0, -0.9, 0]} opacity={0.4} scale={6} blur={2.5} far={4} />
      <Environment preset="city" />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={1.2}
        maxDistance={5}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
      />
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface VRMProfileViewerProps {
  url: string;
  showControls?: boolean;
  height?: number;
  className?: string;
}

export default function VRMProfileViewer({
  url,
  showControls = true,
  height = 480,
  className,
}: VRMProfileViewerProps) {
  const [animation, setAnimation] = useState<AnimState>("idle");
  const [emotion, setEmotion]     = useState<EmotionState>("neutral");
  const [bg, setBg]               = useState("dark");

  const bgConfig = BACKGROUNDS.find((b) => b.value === bg) ?? BACKGROUNDS[0];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className={cn("w-full rounded-2xl overflow-hidden border border-slate-800 relative", bgConfig.class)}
        style={{ height }}
      >
        <Canvas camera={{ position: [0, 0.8, 3], fov: 45 }}>
          <Suspense fallback={null}>
            <VRMScene
              url={url}
              animation={animation}
              emotion={emotion}
              showStars={bg === "stars"}
            />
          </Suspense>
        </Canvas>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-white/30 pointer-events-none bg-black/20 px-3 py-1 rounded-full">
          Di chuột để nhân vật nhìn theo · Kéo để xoay
        </div>
      </div>

      {showControls && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium">Cảm xúc</p>
            <div className="flex gap-1.5 flex-wrap">
              {EMOTIONS.map((e) => (
                <button
                  key={e.value}
                  onClick={() => setEmotion(e.value)}
                  title={e.label}
                  className={cn(
                    "w-9 h-9 rounded-xl text-lg transition-all",
                    emotion === e.value
                      ? "bg-pink-100 dark:bg-pink-950/40 ring-2 ring-pink-500 scale-110"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/20"
                  )}
                >
                  {e.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium">Tư thế</p>
            <div className="flex gap-1.5 flex-wrap">
              {POSES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setAnimation(p.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                    animation === p.value
                      ? "bg-purple-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                  )}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium">Nền</p>
            <div className="flex gap-1.5">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setBg(b.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                    bg === b.value
                      ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20 text-pink-600"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-pink-300"
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
