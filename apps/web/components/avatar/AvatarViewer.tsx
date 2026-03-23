"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils, VRMExpressionPresetName } from "@pixiv/three-vrm";

function AvatarScene({ url }: { url: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const vrmRef = useRef<VRM | null>(null);
  const controlsRef = useRef<any>(null);
  const blinkTimer = useRef(0);
  const blinkVal = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const headTarget = useRef({ x: 0, y: 0 });
  const { camera, gl } = useThree();

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

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.register((p) => new VRMLoaderPlugin(p));
    loader.load(url, (gltf) => {
      if (cancelled) return;
      const vrm = gltf.userData.vrm as VRM;
      if (!vrm) return;
      VRMUtils.removeUnnecessaryVertices(vrm.scene);
      VRMUtils.combineSkeletons(vrm.scene);
      VRMUtils.rotateVRM0(vrm);
      groupRef.current?.add(vrm.scene);
      vrmRef.current = vrm;

      // Wait one frame for matrices to update, then fit camera
      requestAnimationFrame(() => {
        if (!groupRef.current) return;
        const box = new THREE.Box3().setFromObject(groupRef.current);
        if (box.isEmpty()) return;
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        // Fit full height + width into view with padding
        const cam = camera as THREE.PerspectiveCamera;
        const aspect = cam.aspect;
        const fovRad = (cam.fov * Math.PI) / 180;
        const distH = (size.y / 2) / Math.tan(fovRad / 2);
        const distW = (size.x / 2) / (Math.tan(fovRad / 2) * aspect);
        const dist = Math.max(distH, distW) * 1.15;

        cam.position.set(center.x, center.y, center.z + dist);
        cam.lookAt(center);

        // Sync OrbitControls target to model center
        if (controlsRef.current) {
          controlsRef.current.target.copy(center);
          controlsRef.current.update();
        }
      });
    }, undefined, (err) => console.error("VRM load error:", err));
    return () => {
      cancelled = true;
      vrmRef.current = null;
      groupRef.current?.clear();
    };
  }, [url, camera]);

  useFrame((_, delta) => {
    const vrm = vrmRef.current;
    if (!vrm) return;
    vrm.update(delta);

    blinkTimer.current += delta;
    if (blinkTimer.current > 3.5 + Math.random() * 2) { blinkTimer.current = 0; blinkVal.current = 1; }
    if (blinkVal.current > 0) blinkVal.current = Math.max(0, blinkVal.current - delta * 8);
    if (vrm.expressionManager) {
      try { vrm.expressionManager.setValue(VRMExpressionPresetName.Blink, blinkVal.current); } catch {}
    }

    headTarget.current.x = THREE.MathUtils.lerp(headTarget.current.x, mouseRef.current.y * 0.25, 0.04);
    headTarget.current.y = THREE.MathUtils.lerp(headTarget.current.y, mouseRef.current.x * 0.35, 0.04);
    const head = vrm.humanoid?.getNormalizedBoneNode("head");
    if (head) {
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, headTarget.current.x, 0.1);
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, headTarget.current.y, 0.1);
    }

    const spine = vrm.humanoid?.getNormalizedBoneNode("spine");
    if (spine) spine.rotation.x = Math.sin(performance.now() / 1000 * 1.4) * 0.01;
  });

  return (
    <>
      <group ref={groupRef} />
      <ContactShadows position={[0, -0.9, 0]} opacity={0.35} scale={6} blur={2.5} far={4} />
      <Environment preset="city" />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={1}
        maxDistance={6}
      />
    </>
  );
}

interface AvatarViewerProps {
  url: string;
  height?: number;
}

export default function AvatarViewer({ url, height = 480 }: AvatarViewerProps) {
  return (
    <div
      className="w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative"
      style={{ height }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 40 }}>
        <ambientLight intensity={1.6} />
        <directionalLight position={[2, 4, 2]} intensity={2.2} color="#fff5e0" />
        <directionalLight position={[-2, 3, 1]} intensity={0.8} color="#a5b4fc" />
        <pointLight position={[0, 2, 1.5]} intensity={0.6} color="#f9a8d4" />
        <Suspense fallback={null}>
          <AvatarScene url={url} />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/30 pointer-events-none select-none">
        Di chuột để nhân vật nhìn theo · Kéo để xoay
      </div>
    </div>
  );
}
