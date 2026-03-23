"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PlayerControllerHandle } from "./PlayerController";

type Props = {
  targetRef: React.RefObject<PlayerControllerHandle | null>;
  mode: "third" | "first";
  onYawChange?: (yaw: number) => void;
};

const MIN_PITCH = -Math.PI / 2.5;
const MAX_PITCH = Math.PI / 8;
const MIN_DIST  = 2;
const MAX_DIST  = 12;

export default function CameraController({ targetRef, mode, onYawChange }: Props) {
  const { camera, gl } = useThree();
  const yaw       = useRef(0);
  const pitch     = useRef(-0.25);
  const distance  = useRef(4.5);
  const smoothPos    = useRef(new THREE.Vector3());
  const smoothTarget = useRef(new THREE.Vector3());
  const isLocked  = useRef(false);

  // Touch state
  const lastTouchDist = useRef(0);
  const lastTouchX    = useRef(0);
  const lastTouchY    = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;

    // ── Pointer lock ──────────────────────────────────────────────────────────
    const onLockChange = () => {
      isLocked.current = document.pointerLockElement === canvas;
    };

    // Click canvas → request pointer lock (both modes)
    const onClick = () => {
      if (!isLocked.current) canvas.requestPointerLock();
    };

    // ── Mouse move (pointer locked) ───────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return;
      const sens = mode === "first" ? 0.002 : 0.003;
      yaw.current   -= e.movementX * sens;
      pitch.current -= e.movementY * sens;
      pitch.current  = Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch.current));
      onYawChange?.(yaw.current);
    };

    // ── Scroll zoom (third person only) ──────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      if (mode === "first") return;
      distance.current = Math.max(MIN_DIST, Math.min(MAX_DIST, distance.current + e.deltaY * 0.008));
    };

    // ── Touch (mobile) ────────────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        lastTouchX.current = e.touches[0].clientX;
        lastTouchY.current = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        lastTouchDist.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastTouchX.current;
        const dy = e.touches[0].clientY - lastTouchY.current;
        lastTouchX.current = e.touches[0].clientX;
        lastTouchY.current = e.touches[0].clientY;
        yaw.current   -= dx * 0.005;
        pitch.current -= dy * 0.005;
        pitch.current  = Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch.current));
        onYawChange?.(yaw.current);
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        distance.current = Math.max(
          MIN_DIST,
          Math.min(MAX_DIST, distance.current - (dist - lastTouchDist.current) * 0.02)
        );
        lastTouchDist.current = dist;
      }
    };

    // Prevent context menu
    const onContextMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener("click",        onClick);
    canvas.addEventListener("contextmenu",  onContextMenu);
    canvas.addEventListener("wheel",        onWheel,      { passive: true });
    canvas.addEventListener("touchstart",   onTouchStart, { passive: true });
    canvas.addEventListener("touchmove",    onTouchMove,  { passive: true });
    document.addEventListener("mousemove",       onMouseMove);
    document.addEventListener("pointerlockchange", onLockChange);

    return () => {
      canvas.removeEventListener("click",       onClick);
      canvas.removeEventListener("contextmenu", onContextMenu);
      canvas.removeEventListener("wheel",       onWheel);
      canvas.removeEventListener("touchstart",  onTouchStart);
      canvas.removeEventListener("touchmove",   onTouchMove);
      document.removeEventListener("mousemove",        onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
    };
  }, [mode, gl, onYawChange]);

  // Exit pointer lock when switching to non-game mode
  useEffect(() => {
    return () => {
      if (document.pointerLockElement) document.exitPointerLock();
    };
  }, []);

  useFrame(() => {
    if (!targetRef.current) return;
    const pos = targetRef.current.getPosition();

    const HEAD_HEIGHT = 1.2;   // third-person: lookAt vào ngực/cổ
    const EYE_HEIGHT  = 1.45;  // first-person: ngang mắt nhân vật (~1.45m từ chân)

    const targetPos = new THREE.Vector3(pos.x, pos.y + HEAD_HEIGHT, pos.z);
    smoothTarget.current.lerp(targetPos, 0.14);

    if (mode === "third") {
      const cosP = Math.cos(pitch.current);
      const x = smoothTarget.current.x + distance.current * Math.sin(yaw.current) * cosP;
      const y = smoothTarget.current.y + distance.current * Math.sin(-pitch.current);
      const z = smoothTarget.current.z + distance.current * Math.cos(yaw.current) * cosP;

      smoothPos.current.lerp(new THREE.Vector3(x, y, z), 0.1);
      camera.position.copy(smoothPos.current);
      camera.lookAt(smoothTarget.current);
    } else {
      // First-person: camera đặt ngang mắt nhân vật
      // pos.y = vị trí chân (floorY), cộng EYE_HEIGHT để lên ngang mắt
      const eyePos = new THREE.Vector3(pos.x, pos.y + EYE_HEIGHT, pos.z);
      camera.position.lerp(eyePos, 0.3);
      const lookDir = new THREE.Vector3(
        Math.sin(yaw.current) * Math.cos(pitch.current),
        Math.sin(pitch.current),
        Math.cos(yaw.current) * Math.cos(pitch.current)
      );
      camera.lookAt(eyePos.clone().add(lookDir));
    }
  });

  return null;
}
