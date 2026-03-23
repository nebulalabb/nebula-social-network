"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import AvatarNameplate from "./AvatarNameplate";
import AnimeCharacter, { AnimationState } from "./AnimeCharacter";

type MoveState = { x: number; y: number; z: number; ry: number };

export type PlayerControllerHandle = {
  getPosition: () => THREE.Vector3;
  getRotationY: () => number;
  playEmote: (key: string) => void;
};

type Props = {
  onMove?: (state: MoveState) => void;
  username?: string;
  isSpeaking?: boolean;
  mouthOpen?: number;
  cameraMode?: "third" | "first";
  hairColor?: string;
  clothColor?: string;
  cameraYaw?: number;
  vrmUrl?: string;
  floorY?: number;
};

const SPEED        = 5;
const SPRINT_SPEED = 9;
const GRAVITY      = -20;
const JUMP_VEL     = 7;

// AABB wall boxes [x1, z1, x2, z2] — outer boundary only
// Inner walls removed to avoid blocking movement until map layout is confirmed
const WALL_BOXES: [number, number, number, number][] = [
  [-30, -30, -28, 30],
  [ 28, -30,  30, 30],
  [-30, -30,  30, -28],
  [-30,  28,  30,  30],
];

function resolveWallCollision(pos: THREE.Vector3, radius = 0.35): THREE.Vector3 {
  const out = pos.clone();
  for (const [x1, z1, x2, z2] of WALL_BOXES) {
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    const hw = (x2 - x1) / 2 + radius;
    const hd = (z2 - z1) / 2 + radius;
    const dx = out.x - cx;
    const dz = out.z - cz;
    if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
      const ox = hw - Math.abs(dx);
      const oz = hd - Math.abs(dz);
      if (ox < oz) out.x += dx > 0 ? ox : -ox;
      else         out.z += dz > 0 ? oz : -oz;
    }
  }
  return out;
}

const PlayerController = forwardRef<PlayerControllerHandle, Props>(
  function PlayerController(
    {
      onMove,
      username = "Bạn",
      isSpeaking,
      mouthOpen = 0,
      cameraMode = "third",
      hairColor,
      clothColor,
      cameraYaw = 0,
      vrmUrl,
      floorY = 0,
    },
    ref
  ) {
    const groupRef    = useRef<THREE.Group>(null);
    const keys        = useRef<Record<string, boolean>>({});
    const lastSend    = useRef(0);
    const rotY        = useRef(0);
    const velY        = useRef(0);
    const posRef      = useRef(new THREE.Vector3(0, floorY, 0));
    // Keep cameraYaw in a ref so useFrame always reads latest value without re-render
    const yawRef      = useRef(cameraYaw);
    const [anim, setAnim] = useState<AnimationState>("idle");
    const animRef     = useRef<AnimationState>("idle");
    // Emote override: when set, blocks movement animation for duration
    const emoteRef    = useRef<{ key: string; until: number } | null>(null);
    const { gl }      = useThree();

    // Sync prop → ref every render
    yawRef.current = cameraYaw;

    useImperativeHandle(ref, () => ({
      getPosition:  () => posRef.current.clone(),
      getRotationY: () => rotY.current,
      playEmote: (key: string) => {
        const validEmotes: AnimationState[] = ["wave","dance","bow","heart","laugh","angry","sit","sleep","attack","hurt"];
        const emoteKey = validEmotes.includes(key as AnimationState) ? (key as AnimationState) : null;
        if (!emoteKey) return;
        // 3s duration for most emotes, sit/sleep hold until another emote
        const duration = (emoteKey === "sit" || emoteKey === "sleep") ? 8000 : 3000;
        emoteRef.current = { key: emoteKey, until: Date.now() + duration };
        animRef.current = emoteKey;
        setAnim(emoteKey);
      },
    }));

    useEffect(() => {
      const canvas = gl.domElement;
      canvas.setAttribute("tabindex", "0");

      const onKeyDown = (e: KeyboardEvent) => {
        const key     = e.key.toLowerCase();
        const active  = document.activeElement;
        const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
        if (!isInput && ["arrowup","arrowdown","arrowleft","arrowright"," "].includes(key)) {
          e.preventDefault();
        }
        keys.current[key] = true;
      };
      const onKeyUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup",   onKeyUp);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup",   onKeyUp);
      };
    }, [gl]);

    useFrame((_, delta) => {
      const sprint   = keys.current["shift"];
      const speed    = sprint ? SPRINT_SPEED : SPEED;
      const dir      = new THREE.Vector3();

      if (keys.current["w"] || keys.current["arrowup"])    dir.z -= 1;
      if (keys.current["s"] || keys.current["arrowdown"])  dir.z += 1;
      if (keys.current["a"] || keys.current["arrowleft"])  dir.x -= 1;
      if (keys.current["d"] || keys.current["arrowright"]) dir.x += 1;

      const moving   = dir.length() > 0;
      const onGround = posRef.current.y <= floorY + 0.05;

      // Jump
      if (keys.current[" "] && onGround) {
        velY.current = JUMP_VEL;
      }

      // Gravity + vertical movement
      velY.current     += GRAVITY * delta;
      posRef.current.y += velY.current * delta;
      if (posRef.current.y <= floorY) {
        posRef.current.y = floorY;
        velY.current     = 0;
      }

      // Horizontal movement — cancel emote if player starts moving
      if (moving) {
        // Cancel emote when player moves
        if (emoteRef.current) emoteRef.current = null;

        dir.normalize();
        // Rotate input direction by camera yaw — W always = forward relative to camera
        dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);
        posRef.current.x += dir.x * speed * delta;
        posRef.current.z += dir.z * speed * delta;

        // Wall collision
        const resolved   = resolveWallCollision(posRef.current);
        posRef.current.x = resolved.x;
        posRef.current.z = resolved.z;

        // Boundary clamp
        posRef.current.x = THREE.MathUtils.clamp(posRef.current.x, -28, 28);
        posRef.current.z = THREE.MathUtils.clamp(posRef.current.z, -28, 28);

        // Character faces movement direction
        rotY.current = Math.atan2(dir.x, dir.z);

        const nextAnim: AnimationState = !onGround ? "jump" : sprint ? "run" : "walk";
        if (animRef.current !== nextAnim) { animRef.current = nextAnim; setAnim(nextAnim); }
      } else {
        // Check emote override
        const now = Date.now();
        if (emoteRef.current && now < emoteRef.current.until) {
          // Hold emote animation — do nothing to animRef
        } else {
          if (emoteRef.current) emoteRef.current = null;
          const nextAnim: AnimationState = onGround ? "idle" : "jump";
          if (animRef.current !== nextAnim) { animRef.current = nextAnim; setAnim(nextAnim); }
        }
      }

      // Apply transform to visual group
      if (groupRef.current) {
        groupRef.current.position.copy(posRef.current);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          rotY.current,
          delta * 12
        );
      }

      // Throttled network send (80ms)
      const now = Date.now();
      if (now - lastSend.current > 80) {
        lastSend.current = now;
        onMove?.({ x: posRef.current.x, y: posRef.current.y, z: posRef.current.z, ry: rotY.current });
      }
    });

    return (
      <group ref={groupRef} position={[0, floorY, 0]}>
        <AnimeCharacter
          vrmUrl={vrmUrl}
          animation={anim}
          mouthOpen={mouthOpen}
          isSpeaking={isSpeaking}
          hairColor={hairColor}
          clothColor={clothColor}
        />
        {cameraMode === "third" && (
          <AvatarNameplate name={username} isSpeaking={isSpeaking} />
        )}
      </group>
    );
  }
);

export default PlayerController;
