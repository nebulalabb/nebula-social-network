"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import VRMAvatar from "./VRMAvatar";
import type { AnimState } from "./VRMAvatar";

export type AnimationState = AnimState;

interface AnimeCharacterProps {
  vrmUrl?: string;
  color?: string;
  hairColor?: string;
  clothColor?: string;
  animation?: AnimationState;
  mouthOpen?: number;
  isSpeaking?: boolean;
}

// ── Anime-style eye ──────────────────────────────────────────────────────────
// Use circleGeometry + non-uniform scale to fake ellipse (no EllipseGeometry in R3F)
function AnimeEye({ x, blink }: { x: number; blink: number }) {
  const irisScale = 1 - blink * 0.95;
  return (
    <group position={[x, 0, 0]}>
      {/* White sclera — circle scaled to ellipse */}
      <mesh scale={[0.055, 0.07, 1]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Iris — emissive glow for anime eye effect */}
      <mesh position={[0, 0, 0.001]} scale={[0.042, 0.058 * irisScale, 1]}>
        <circleGeometry args={[1, 16]} />
        <meshToonMaterial color="#3b82f6" emissive="#60a5fa" emissiveIntensity={0.6} />
      </mesh>
      {/* Pupil */}
      <mesh position={[0, 0, 0.002]} scale={[0.022, 0.03 * irisScale, 1]}>
        <circleGeometry args={[1, 12]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      {/* Highlight */}
      <mesh position={[0.015, 0.018, 0.003]}>
        <circleGeometry args={[0.012, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.01, -0.01, 0.003]}>
        <circleGeometry args={[0.007, 8]} />
        <meshToonMaterial color="#bfdbfe" emissive="#bfdbfe" emissiveIntensity={0.4} />
      </mesh>
      {/* Upper eyelid (blink cover) */}
      <mesh position={[0, 0.055 - blink * 0.055, 0.004]}>
        <boxGeometry args={[0.12, 0.018 + blink * 0.1, 0.001]} />
        <meshBasicMaterial color="#1e1b4b" />
      </mesh>
      {/* Lashes */}
      {[-0.04, -0.02, 0, 0.02, 0.04].map((lx, i) => (
        <mesh key={i} position={[lx, 0.065, 0.004]} rotation={[0, 0, lx * 0.5]}>
          <boxGeometry args={[0.008, 0.018, 0.001]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      ))}
    </group>
  );
}

// ── Hair strand group ────────────────────────────────────────────────────────
function HairStrands({ color }: { color: string }) {
  return (
    <group>
      {/* Main hair cap */}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.235, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Side hair left */}
      <mesh position={[-0.19, -0.05, 0.02]} rotation={[0.1, 0.3, 0.15]}>
        <capsuleGeometry args={[0.055, 0.32, 6, 8]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Side hair right */}
      <mesh position={[0.19, -0.05, 0.02]} rotation={[0.1, -0.3, -0.15]}>
        <capsuleGeometry args={[0.055, 0.32, 6, 8]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Back hair */}
      <mesh position={[0, -0.12, -0.12]} rotation={[0.2, 0, 0]}>
        <capsuleGeometry args={[0.12, 0.45, 6, 8]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Ahoge (antenna hair) */}
      <mesh position={[0.04, 0.26, 0.05]} rotation={[0.3, 0.2, 0.4]}>
        <capsuleGeometry args={[0.018, 0.14, 4, 6]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Fringe strands */}
      {[-0.1, -0.04, 0.04, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.02, 0.2]} rotation={[-0.1, 0, x * 0.3]}>
          <capsuleGeometry args={[0.022, 0.1, 4, 6]} />
          <meshToonMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

// ── Anime face ───────────────────────────────────────────────────────────────
function AnimeFace({ blink, mouthOpen }: { blink: number; mouthOpen: number }) {
  return (
    <group position={[0, 0, 0.195]}>
      {/* Eyes */}
      <group position={[0, 0.04, 0]}>
        <AnimeEye x={0.075} blink={blink} />
        <AnimeEye x={-0.075} blink={blink} />
      </group>
      {/* Nose — subtle dot */}
      <mesh position={[0, -0.025, 0.001]}>
        <circleGeometry args={[0.008, 6]} />
        <meshBasicMaterial color="#f9a8d4" />
      </mesh>
      {/* Mouth */}
      <group position={[0, -0.065, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.008, 0.055, 4, 6]} />
          <meshBasicMaterial color="#be185d" />
        </mesh>
        {mouthOpen > 0.1 && (
          <mesh position={[0, -0.01, 0.001]} scale={[0.03, 0.02 * mouthOpen, 1]}>
            <circleGeometry args={[1, 10]} />
            <meshBasicMaterial color="#7f1d1d" />
          </mesh>
        )}
      </group>
      {/* Blush */}
      <mesh position={[0.1, -0.01, 0]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#fda4af" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-0.1, -0.01, 0]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#fda4af" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// ── Skirt ────────────────────────────────────────────────────────────────────
function Skirt({ color }: { color: string }) {
  return (
    <group position={[0, 0.52, 0]}>
      <mesh>
        <cylinderGeometry args={[0.22, 0.32, 0.28, 12]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Skirt trim */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.32, 0.34, 0.04, 12]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// ── Full stylized anime character ────────────────────────────────────────────
function StylizedAnimeCharacter({
  clothColor = "#6366f1",
  hairColor = "#7c3aed",
  animation = "idle",
  mouthOpen = 0,
}: {
  clothColor?: string;
  hairColor?: string;
  animation?: AnimationState;
  mouthOpen?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const lArmRef = useRef<THREE.Group>(null);
  const rArmRef = useRef<THREE.Group>(null);
  const lLegRef = useRef<THREE.Group>(null);
  const rLegRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const blinkRef = useRef(0);
  const blinkTimer = useRef(0);
  const elapsedRef = useRef(0);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const t = elapsedRef.current;

    // Auto blink
    blinkTimer.current += delta;
    if (blinkTimer.current > 3.5 + Math.random() * 2) {
      blinkTimer.current = 0;
      blinkRef.current = 1;
    }
    if (blinkRef.current > 0) {
      blinkRef.current = Math.max(0, blinkRef.current - delta * 8);
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t * 0.18;

    switch (animation) {
      case "idle": {
        const b = Math.sin(t * 1.4) * 0.012;
        if (bodyRef.current) bodyRef.current.position.y = Math.sin(t * 1.4) * 0.015;
        if (headRef.current) {
          headRef.current.rotation.y = Math.sin(t * 0.5) * 0.06;
          headRef.current.rotation.z = Math.sin(t * 0.7) * 0.025;
        }
        if (lArmRef.current) {
          lArmRef.current.rotation.z = lerp(lArmRef.current.rotation.z, 0.18 + b, 1);
          lArmRef.current.rotation.x = lerp(lArmRef.current.rotation.x, 0.05, 1);
        }
        if (rArmRef.current) {
          rArmRef.current.rotation.z = lerp(rArmRef.current.rotation.z, -0.18 - b, 1);
          rArmRef.current.rotation.x = lerp(rArmRef.current.rotation.x, 0.05, 1);
        }
        if (lLegRef.current) lLegRef.current.rotation.x = 0;
        if (rLegRef.current) rLegRef.current.rotation.x = 0;
        break;
      }
      case "walk": {
        const sw = Math.sin(t * 5.5);
        if (bodyRef.current) bodyRef.current.position.y = Math.abs(Math.sin(t * 11)) * 0.04;
        if (lArmRef.current) {
          lArmRef.current.rotation.x = sw * 0.55;
          lArmRef.current.rotation.z = 0.12;
        }
        if (rArmRef.current) {
          rArmRef.current.rotation.x = -sw * 0.55;
          rArmRef.current.rotation.z = -0.12;
        }
        if (lLegRef.current) lLegRef.current.rotation.x = -sw * 0.6;
        if (rLegRef.current) rLegRef.current.rotation.x = sw * 0.6;
        if (headRef.current) headRef.current.rotation.y = sw * 0.04;
        break;
      }
      case "run": {
        const sw = Math.sin(t * 9);
        if (bodyRef.current) {
          bodyRef.current.rotation.x = -0.12;
          bodyRef.current.position.y = Math.abs(Math.sin(t * 18)) * 0.06;
        }
        if (lArmRef.current) {
          lArmRef.current.rotation.x = sw * 0.9;
          lArmRef.current.rotation.z = 0.2;
        }
        if (rArmRef.current) {
          rArmRef.current.rotation.x = -sw * 0.9;
          rArmRef.current.rotation.z = -0.2;
        }
        if (lLegRef.current) lLegRef.current.rotation.x = -sw * 1.0;
        if (rLegRef.current) rLegRef.current.rotation.x = sw * 1.0;
        break;
      }
      case "jump": {
        if (bodyRef.current) bodyRef.current.rotation.x = -0.2;
        if (lArmRef.current) { lArmRef.current.rotation.x = -1.2; lArmRef.current.rotation.z = 0.4; }
        if (rArmRef.current) { rArmRef.current.rotation.x = -1.2; rArmRef.current.rotation.z = -0.4; }
        if (lLegRef.current) lLegRef.current.rotation.x = -0.4;
        if (rLegRef.current) rLegRef.current.rotation.x = -0.4;
        break;
      }
      case "wave": {
        if (rArmRef.current) {
          rArmRef.current.rotation.x = -1.2;
          rArmRef.current.rotation.z = -0.3 + Math.sin(t * 7) * 0.4;
        }
        if (lArmRef.current) { lArmRef.current.rotation.x = 0; lArmRef.current.rotation.z = 0.18; }
        if (headRef.current) headRef.current.rotation.y = Math.sin(t * 2) * 0.1;
        break;
      }
      case "dance": {
        const f = 3.5;
        if (bodyRef.current) {
          bodyRef.current.rotation.y = Math.sin(t * f) * 0.3;
          bodyRef.current.position.y = Math.abs(Math.sin(t * f * 2)) * 0.08;
        }
        if (lArmRef.current) {
          lArmRef.current.rotation.x = Math.sin(t * f) * 0.8;
          lArmRef.current.rotation.z = 0.5 + Math.sin(t * f * 0.5) * 0.3;
        }
        if (rArmRef.current) {
          rArmRef.current.rotation.x = -Math.sin(t * f) * 0.8;
          rArmRef.current.rotation.z = -0.5 - Math.sin(t * f * 0.5) * 0.3;
        }
        if (lLegRef.current) lLegRef.current.rotation.x = Math.sin(t * f * 2) * 0.3;
        if (rLegRef.current) rLegRef.current.rotation.x = -Math.sin(t * f * 2) * 0.3;
        if (headRef.current) headRef.current.rotation.z = Math.sin(t * f) * 0.1;
        break;
      }
      case "bow": {
        if (bodyRef.current) bodyRef.current.rotation.x = Math.min(0.7, t * 2);
        if (headRef.current) headRef.current.rotation.x = Math.min(0.4, t * 1.5);
        break;
      }
      case "heart": {
        // Both arms up forming heart shape, body sways gently
        if (lArmRef.current) {
          lArmRef.current.rotation.x = -1.0;
          lArmRef.current.rotation.z = 0.6 + Math.sin(t * 3) * 0.1;
        }
        if (rArmRef.current) {
          rArmRef.current.rotation.x = -1.0;
          rArmRef.current.rotation.z = -0.6 - Math.sin(t * 3) * 0.1;
        }
        if (bodyRef.current) bodyRef.current.position.y = Math.sin(t * 2) * 0.02;
        if (headRef.current) headRef.current.rotation.z = Math.sin(t * 2) * 0.08;
        break;
      }
      case "laugh": {
        if (bodyRef.current) {
          bodyRef.current.rotation.x = Math.sin(t * 8) * 0.08;
          bodyRef.current.position.y = Math.abs(Math.sin(t * 8)) * 0.04;
        }
        if (lArmRef.current) { lArmRef.current.rotation.x = 0.3; lArmRef.current.rotation.z = 0.5; }
        if (rArmRef.current) { rArmRef.current.rotation.x = 0.3; rArmRef.current.rotation.z = -0.5; }
        if (headRef.current) headRef.current.rotation.x = Math.sin(t * 8) * 0.06;
        break;
      }
      case "angry": {
        if (bodyRef.current) bodyRef.current.rotation.x = -0.05;
        if (lArmRef.current) {
          lArmRef.current.rotation.x = 0.5 + Math.sin(t * 6) * 0.1;
          lArmRef.current.rotation.z = 0.8;
        }
        if (rArmRef.current) {
          rArmRef.current.rotation.x = 0.5 + Math.sin(t * 6) * 0.1;
          rArmRef.current.rotation.z = -0.8;
        }
        if (headRef.current) headRef.current.rotation.y = Math.sin(t * 5) * 0.08;
        break;
      }
      case "sit": {
        // Crouch down — legs bent, body lowered
        if (bodyRef.current) bodyRef.current.position.y = -0.3;
        if (lLegRef.current) { lLegRef.current.rotation.x = -1.4; }
        if (rLegRef.current) { rLegRef.current.rotation.x = -1.4; }
        if (lArmRef.current) { lArmRef.current.rotation.x = 0.2; lArmRef.current.rotation.z = 0.3; }
        if (rArmRef.current) { rArmRef.current.rotation.x = 0.2; rArmRef.current.rotation.z = -0.3; }
        if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.5) * 0.05;
        break;
      }
      case "sleep": {
        if (bodyRef.current) { bodyRef.current.position.y = -0.3; bodyRef.current.rotation.x = 0.1; }
        if (lLegRef.current) lLegRef.current.rotation.x = -1.2;
        if (rLegRef.current) rLegRef.current.rotation.x = -1.2;
        if (lArmRef.current) { lArmRef.current.rotation.x = 0.4; lArmRef.current.rotation.z = 0.4; }
        if (rArmRef.current) { rArmRef.current.rotation.x = 0.4; rArmRef.current.rotation.z = -0.4; }
        if (headRef.current) {
          headRef.current.rotation.z = 0.3 + Math.sin(t * 0.8) * 0.05;
          headRef.current.rotation.x = 0.2;
        }
        break;
      }
      case "attack": {
        const phase = (t % 0.6) / 0.6; // 0→1 loop every 0.6s
        if (rArmRef.current) {
          rArmRef.current.rotation.x = phase < 0.5 ? -1.5 * (phase * 2) : -1.5 * (1 - (phase - 0.5) * 2);
          rArmRef.current.rotation.z = -0.2;
        }
        if (bodyRef.current) {
          bodyRef.current.rotation.y = phase < 0.5 ? -0.3 * (phase * 2) : -0.3 * (1 - (phase - 0.5) * 2);
        }
        break;
      }
      case "hurt": {
        if (bodyRef.current) {
          bodyRef.current.rotation.x = 0.3;
          bodyRef.current.position.y = Math.sin(t * 10) * 0.03;
        }
        if (lArmRef.current) { lArmRef.current.rotation.x = -0.5; lArmRef.current.rotation.z = 0.6; }
        if (rArmRef.current) { rArmRef.current.rotation.x = -0.5; rArmRef.current.rotation.z = -0.6; }
        break;
      }
    }
  });

  const skinColor = "#fde68a";
  const accentColor = "#ffffff";

  return (
    <group ref={groupRef}>
      {/* Lift body so feet sit at y=0 */}
      <group ref={bodyRef} position={[0, 0.1, 0]}>
        {/* ── Torso / Shirt ── */}
        <mesh position={[0, 0.82, 0]} castShadow>
          <capsuleGeometry args={[0.175, 0.38, 8, 12]} />
          <meshToonMaterial color={clothColor} />
        </mesh>
        {/* Collar */}
        <mesh position={[0, 1.02, 0.12]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.22, 0.08, 0.06]} />
          <meshToonMaterial color={accentColor} />
        </mesh>
        {/* Ribbon/bow on chest */}
        <mesh position={[0, 0.95, 0.175]}>
          <boxGeometry args={[0.1, 0.06, 0.02]} />
          <meshToonMaterial color="#ec4899" />
        </mesh>

        {/* ── Skirt ── */}
        <Skirt color={clothColor} />

        {/* ── Neck ── */}
        <mesh position={[0, 1.12, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.075, 0.14, 10]} />
          <meshToonMaterial color={skinColor} />
        </mesh>

        {/* ── Head ── */}
        <group ref={headRef} position={[0, 1.38, 0]}>
          {/* Head shape — slightly wider at cheeks */}
          <mesh castShadow>
            <sphereGeometry args={[0.215, 16, 14]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Chin taper */}
          <mesh position={[0, -0.14, 0.04]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Ears */}
          <mesh position={[0.215, 0, 0]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          <mesh position={[-0.215, 0, 0]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Face */}
          <AnimeFace blink={blinkRef.current} mouthOpen={mouthOpen} />
          {/* Hair */}
          <HairStrands color={hairColor} />
        </group>

        {/* ── Left Arm ── */}
        <group ref={lArmRef} position={[0.22, 0.95, 0]}>
          {/* Upper arm */}
          <mesh position={[0.1, -0.1, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.22, 6, 8]} />
            <meshToonMaterial color={clothColor} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0.18, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.2, 6, 8]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Hand */}
          <mesh position={[0.22, -0.44, 0]} castShadow>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
        </group>

        {/* ── Right Arm ── */}
        <group ref={rArmRef} position={[-0.22, 0.95, 0]}>
          <mesh position={[-0.1, -0.1, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.22, 6, 8]} />
            <meshToonMaterial color={clothColor} />
          </mesh>
          <mesh position={[-0.18, -0.3, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.2, 6, 8]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          <mesh position={[-0.22, -0.44, 0]} castShadow>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
        </group>

        {/* ── Left Leg ── */}
        <group ref={lLegRef} position={[0.09, 0.42, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.28, 6, 8]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          {/* Knee sock */}
          <mesh position={[0, -0.42, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.26, 6, 8]} />
            <meshToonMaterial color="#ffffff" />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -0.62, 0.03]} castShadow>
            <boxGeometry args={[0.12, 0.1, 0.2]} />
            <meshToonMaterial color="#1e1b4b" />
          </mesh>
        </group>

        {/* ── Right Leg ── */}
        <group ref={rLegRef} position={[-0.09, 0.42, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.28, 6, 8]} />
            <meshToonMaterial color={skinColor} />
          </mesh>
          <mesh position={[0, -0.42, 0]} castShadow>
            <capsuleGeometry args={[0.065, 0.26, 6, 8]} />
            <meshToonMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, -0.62, 0.03]} castShadow>
            <boxGeometry args={[0.12, 0.1, 0.2]} />
            <meshToonMaterial color="#1e1b4b" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function AnimeCharacter({
  vrmUrl,
  clothColor = "#6366f1",
  hairColor = "#7c3aed",
  animation = "idle",
  mouthOpen = 0,
  isSpeaking = false,
}: AnimeCharacterProps) {
  // Track whether VRM has finished loading so we can hide the fallback
  const [vrmReady, setVrmReady] = useState(false);

  if (vrmUrl) {
    return (
      <group>
        {/* Always mount VRMAvatar — it loads imperatively via useEffect */}
        <VRMAvatar
          vrmUrl={vrmUrl}
          animation={animation}
          mouthOpen={mouthOpen}
          isSpeaking={isSpeaking}
          onLoad={() => setVrmReady(true)}
        />
        {/* Show stylized fallback until VRM is ready */}
        {!vrmReady && (
          <StylizedAnimeCharacter
            clothColor={clothColor}
            hairColor={hairColor}
            animation={animation}
            mouthOpen={mouthOpen}
          />
        )}
      </group>
    );
  }

  return (
    <StylizedAnimeCharacter
      clothColor={clothColor}
      hairColor={hairColor}
      animation={animation}
      mouthOpen={mouthOpen}
    />
  );
}
