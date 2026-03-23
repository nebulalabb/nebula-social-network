"use client";

import { useEffect, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

interface RoomGLBMapProps {
  url?: string;
  position?: [number, number, number];
  scale?: number;
  applyToon?: boolean;
}

/**
 * Loads a .glb map and:
 * - applies toon shading (optional, keeps PBR if false)
 * - enables castShadow / receiveShadow on every mesh
 * - wraps in a static RigidBody so the player can walk on it
 *
 * Must be rendered inside a <Suspense> boundary.
 */
export default function RoomGLBMap({
  url = "/models-map/room.glb",
  position = [0, 0, 0],
  scale = 1,
  applyToon = false,
}: RoomGLBMapProps) {
  const { scene } = useGLTF(url);
  const cloned = useRef<THREE.Group | null>(null);

  // Clone once so we don't mutate the cached scene
  if (!cloned.current) {
    cloned.current = scene.clone(true);
  }

  useEffect(() => {
    if (!cloned.current) return;
    cloned.current.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;

      if (applyToon) {
        const prev = obj.material as THREE.MeshStandardMaterial;
        obj.material = new THREE.MeshToonMaterial({
          color: prev.color ?? new THREE.Color("#ffffff"),
          map: prev.map ?? null,
        });
      } else {
        const mat = obj.material as THREE.MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) {
          mat.envMapIntensity = 0.6;
        }
      }
    });
  }, [applyToon]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive
        object={cloned.current}
        position={position}
        scale={scale}
      />
    </RigidBody>
  );
}

// Preload so it starts fetching before the scene mounts
useGLTF.preload("/models-map/room.glb");
