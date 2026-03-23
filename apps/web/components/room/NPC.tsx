"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { DialogueTree } from "./ui/DialogueBox";

export interface NPCData {
  id: string;
  name: string;
  icon: string;
  position: [number, number, number];
  color: string;
  dialogue: DialogueTree;
}

interface Props {
  data: NPCData;
  onTalk: (dialogue: DialogueTree, npcName: string) => void;
}

export default function NPC({ data, onTalk }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      // Floating bob
      groupRef.current.position.y = data.position[1] + Math.sin(t * 1.5) * 0.08;
      groupRef.current.rotation.y = Math.sin(t * 0.6) * 0.2;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshToonMaterial;
      mat.emissiveIntensity = 0.4 + Math.sin(t * 2) * 0.2 + (hovered ? 0.4 : 0);
    }
  });

  return (
    <group
      ref={groupRef}
      position={data.position}
      onClick={() => onTalk(data.dialogue, data.name)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Body */}
      <mesh ref={bodyRef} castShadow>
        <capsuleGeometry args={[0.22, 0.55, 6, 12]} />
        <meshToonMaterial color={data.color} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshToonMaterial color="#fde68a" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.08, 0.65, 0.2]}>
        <circleGeometry args={[0.04, 8]} />
        <meshBasicMaterial color="#1e1b4b" />
      </mesh>
      <mesh position={[0.08, 0.65, 0.2]}>
        <circleGeometry args={[0.04, 8]} />
        <meshBasicMaterial color="#1e1b4b" />
      </mesh>

      {/* Glow ring */}
      <mesh ref={glowRef} position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.38, 24]} />
        <meshToonMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Hover label */}
      {hovered && (
        <Html position={[0, 1.2, 0]} center>
          <div className="rounded-xl bg-black/80 px-3 py-1.5 text-xs text-white backdrop-blur-sm border border-white/10 whitespace-nowrap pointer-events-none">
            <span className="mr-1">{data.icon}</span>
            {data.name} — <span className="text-pink-300">Nhấn để nói chuyện</span>
          </div>
        </Html>
      )}

      {/* Floating icon */}
      <Html position={[0, 1.05, 0]} center>
        <div className={`text-lg transition-all duration-200 pointer-events-none ${hovered ? "scale-125" : "scale-100"}`}>
          {data.icon}
        </div>
      </Html>
    </group>
  );
}
