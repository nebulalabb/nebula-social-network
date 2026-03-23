"use client";

import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import AvatarNameplate from "./AvatarNameplate";
import AnimeCharacter, { AnimationState } from "./AnimeCharacter";

type PlayerState = { x: number; y: number; z: number; ry: number };

type Props = {
  state: PlayerState;
  username?: string;
  avatarUrl?: string;
  vrmUrl?: string;
  emote?: string | null;
  isSpeaking?: boolean;
  hairColor?: string;
  clothColor?: string;
  hp?: number;
};

const EMOTE_ICONS: Record<string, string> = {
  wave: "👋", dance: "💃", laugh: "😂", angry: "😡", heart: "❤️", bow: "🙇",
};

const EMOTE_ANIM: Record<string, AnimationState> = {
  wave: "wave", dance: "dance", bow: "bow",
};

export default function RemotePlayer({
  state, username = "Ẩn danh", emote, isSpeaking, hairColor, clothColor, vrmUrl, hp,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const prevRef = useRef<PlayerState>(state);
  const nextRef = useRef<PlayerState>(state);
  const progress = useRef(0);
  const speedRef = useRef(0);
  const prevPos = useRef(new THREE.Vector3(state.x, state.y, state.z));

  useEffect(() => {
    prevRef.current = { ...nextRef.current };
    nextRef.current = { ...state };
    progress.current = 0;
  }, [state]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    progress.current = Math.min(1, progress.current + delta * 12);
    const t = progress.current;

    const pos = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(prevRef.current.x, prevRef.current.y, prevRef.current.z),
      new THREE.Vector3(nextRef.current.x, nextRef.current.y, nextRef.current.z),
      t
    );
    groupRef.current.position.copy(pos);

    // Smooth rotation
    const targetRy = nextRef.current.ry;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y, targetRy, 0.15
    );

    // Estimate speed for animation
    const dist = pos.distanceTo(prevPos.current);
    speedRef.current = THREE.MathUtils.lerp(speedRef.current, dist / delta, 0.1);
    prevPos.current.copy(pos);
  });

  // Determine animation
  let anim: AnimationState = "idle";
  if (emote && EMOTE_ANIM[emote]) {
    anim = EMOTE_ANIM[emote];
  } else if (speedRef.current > 4) {
    anim = "run";
  } else if (speedRef.current > 0.5) {
    anim = "walk";
  }

  const emoteIcon = emote ? EMOTE_ICONS[emote] ?? emote : undefined;

  return (
    <group ref={groupRef}>
      <AnimeCharacter
        animation={anim}
        isSpeaking={isSpeaking}
        hairColor={hairColor}
        clothColor={clothColor}
        vrmUrl={vrmUrl}
      />
      {isSpeaking && (
        <mesh position={[0, 2.2, 0]}>
          <torusGeometry args={[0.35, 0.025, 8, 32]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={3} />
        </mesh>
      )}
      <AvatarNameplate name={username} isSpeaking={isSpeaking} emote={emoteIcon} />
      {/* HP bar — hiện khi bị damage */}
      {hp !== undefined && hp < 100 && (
        <Html position={[0, 2.5, 0]} center>
          <div className="w-20 h-1.5 rounded-full bg-black/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${hp}%`,
                backgroundColor: hp > 60 ? "#4ade80" : hp > 30 ? "#facc15" : "#f87171",
              }}
            />
          </div>
        </Html>
      )}
    </group>
  );
}
