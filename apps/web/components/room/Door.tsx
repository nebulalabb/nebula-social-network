"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface DoorProps {
  position: [number, number, number];
  rotation?: number; // Y rotation in radians
  playerPosRef?: React.RefObject<THREE.Vector3>;
  label?: string;
}

const DOOR_OPEN_ANGLE  = -Math.PI / 2; // 90° open
const DOOR_CLOSE_ANGLE = 0;
const TRIGGER_DIST     = 2.8;

export default function Door({
  position,
  rotation = 0,
  playerPosRef,
  label = "Cửa ra vào",
}: DoorProps) {
  const doorPanelRef = useRef<THREE.Group>(null);
  const [open, setOpen]   = useState(false);
  const [near, setNear]   = useState(false);
  const nearRef           = useRef(false);
  const targetAngle       = useRef(DOOR_CLOSE_ANGLE);
  const currentAngle      = useRef(DOOR_CLOSE_ANGLE);
  const worldPos          = useRef(new THREE.Vector3(...position));

  // Phím E để mở/đóng cửa
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e" && nearRef.current) {
        setOpen((prev) => {
          targetAngle.current = prev ? DOOR_CLOSE_ANGLE : DOOR_OPEN_ANGLE;
          return !prev;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useFrame((_, delta) => {
    // Proximity check
    if (playerPosRef?.current) {
      const d = worldPos.current.distanceTo(playerPosRef.current);
      const isNear = d < TRIGGER_DIST;
      nearRef.current = isNear;
      if (isNear !== near) setNear(isNear);

      // Auto-open when very close (optional — comment out if you want manual only)
      if (d < 1.8 && !open) {
        setOpen(true);
        targetAngle.current = DOOR_OPEN_ANGLE;
      } else if (d > TRIGGER_DIST + 1 && open) {
        setOpen(false);
        targetAngle.current = DOOR_CLOSE_ANGLE;
      }
    }

    // Smooth door swing animation
    if (doorPanelRef.current) {
      currentAngle.current = THREE.MathUtils.lerp(
        currentAngle.current,
        targetAngle.current,
        delta * 5
      );
      doorPanelRef.current.rotation.y = currentAngle.current;
    }
  });

  const frameColor  = "#8d6e63";
  const panelColor  = "#a1887f";
  const glassColor  = "#b3e5fc";
  const handleColor = "#ffd54f";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Door frame */}
      {/* Left post */}
      <mesh position={[-0.62, 1.1, 0]} castShadow>
        <boxGeometry args={[0.12, 2.2, 0.18]} />
        <meshToonMaterial color={frameColor} />
      </mesh>
      {/* Right post */}
      <mesh position={[0.62, 1.1, 0]} castShadow>
        <boxGeometry args={[0.12, 2.2, 0.18]} />
        <meshToonMaterial color={frameColor} />
      </mesh>
      {/* Top beam */}
      <mesh position={[0, 2.26, 0]} castShadow>
        <boxGeometry args={[1.36, 0.14, 0.18]} />
        <meshToonMaterial color={frameColor} />
      </mesh>

      {/* Door panel — pivots from left edge (hinge side) */}
      {/* Pivot is at x=-0.56 so we offset the panel mesh by +0.56 */}
      <group ref={doorPanelRef} position={[-0.56, 0, 0]}>
        {/* Main panel */}
        <mesh position={[0.56, 1.1, 0]} castShadow>
          <boxGeometry args={[1.0, 2.1, 0.08]} />
          <meshToonMaterial color={panelColor} />
        </mesh>
        {/* Upper glass panel */}
        <mesh position={[0.56, 1.55, 0.01]}>
          <boxGeometry args={[0.7, 0.8, 0.02]} />
          <meshToonMaterial color={glassColor} transparent opacity={0.55} />
        </mesh>
        {/* Lower decorative panel */}
        <mesh position={[0.56, 0.65, 0.01]}>
          <boxGeometry args={[0.7, 0.55, 0.02]} />
          <meshToonMaterial color={panelColor} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.98, 1.05, 0.06]} castShadow>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshToonMaterial color={handleColor} emissive={handleColor} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0.98, 1.05, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.12, 6]} />
          <meshToonMaterial color={handleColor} />
        </mesh>
      </group>

      {/* Interaction prompt */}
      {near && (
        <Html position={[0, 2.6, 0]} center>
          <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5 shadow-lg pointer-events-none select-none">
            <kbd className="bg-white/20 text-white font-bold text-xs px-2 py-0.5 rounded-md border border-white/30 font-mono">
              E
            </kbd>
            <span className="text-white text-xs font-medium">
              {open ? "Đóng cửa" : label}
            </span>
            <span className="text-lg">{open ? "🚪" : "🔓"}</span>
          </div>
        </Html>
      )}

      {/* Glow at base when near */}
      {near && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.9, 32]} />
          <meshToonMaterial
            color="#ffd54f"
            emissive="#ffd54f"
            emissiveIntensity={0.6}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
