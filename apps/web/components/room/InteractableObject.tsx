"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { FurnitureItemData } from "./ui/ItemInfoPanel";

type Props = {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  item: FurnitureItemData;
  playerPosRef?: React.RefObject<THREE.Vector3>;
  onSelect: (item: FurnitureItemData) => void;
  children?: React.ReactNode;
};

const RARITY_GLOW: Record<string, string> = {
  common:    "#64748b",
  rare:      "#3b82f6",
  epic:      "#8b5cf6",
  legendary: "#f59e0b",
};

const INTERACT_DIST = 3.0;

export default function InteractableObject({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  item,
  playerPosRef,
  onSelect,
  children,
}: Props) {
  const groupRef   = useRef<THREE.Group>(null);
  const glowRingRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [near, setNear]       = useState(false);
  const nearRef    = useRef(false);
  const scaleRef   = useRef(scale);

  // Phím E để tương tác khi đứng gần
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e" && nearRef.current) {
        onSelect(item);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, onSelect]);

  useFrame(({ clock }) => {
    if (playerPosRef?.current != null && groupRef.current) {
      const d = groupRef.current.position.distanceTo(playerPosRef.current);
      const isNear = d < INTERACT_DIST;
      nearRef.current = isNear;
      if (isNear !== near) setNear(isNear);
    }

    // Glow ring pulse
    if (glowRingRef.current) {
      const mat = glowRingRef.current.material as THREE.MeshToonMaterial;
      const base = hovered ? 0.9 : near ? 0.6 : 0.2;
      mat.emissiveIntensity = base + Math.sin(clock.elapsedTime * 2.5) * 0.15;
      glowRingRef.current.rotation.y += 0.02;
    }

    // Hover scale spring
    if (groupRef.current) {
      const target = hovered ? scale * 1.06 : scale;
      scaleRef.current = THREE.MathUtils.lerp(scaleRef.current, target, 0.12);
      groupRef.current.scale.setScalar(scaleRef.current);
    }
  });

  const glowColor = RARITY_GLOW[item.rarity] ?? "#64748b";

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      userData={{ interactable: true, itemData: item }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onSelect(item); }}
    >
      {children ?? (
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshToonMaterial color={hovered ? "#a78bfa" : "#6366f1"} />
        </mesh>
      )}

      {/* Glow ring on floor */}
      <mesh ref={glowRingRef} position={[0, -0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.6, 32]} />
        <meshToonMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Proximity prompt — hiện nút E khi đứng gần */}
      {near && (
        <Html position={[0, 1.2, 0]} center>
          <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
            {/* Nút E */}
            <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5 shadow-lg">
              <kbd className="bg-white/20 text-white font-bold text-xs px-2 py-0.5 rounded-md border border-white/30 font-mono">
                E
              </kbd>
              <span className="text-white text-xs font-medium">{item.name}</span>
              <span className="text-white/40 text-[10px]">{item.icon}</span>
            </div>
            {/* Rarity badge */}
            <div className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
              item.rarity === "legendary" ? "bg-amber-500/30 text-amber-300" :
              item.rarity === "epic"      ? "bg-purple-500/30 text-purple-300" :
              item.rarity === "rare"      ? "bg-blue-500/30 text-blue-300" :
                                            "bg-slate-500/30 text-slate-300"
            }`}>
              {item.rarity}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
