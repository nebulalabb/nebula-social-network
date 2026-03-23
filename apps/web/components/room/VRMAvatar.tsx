"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRM, VRMLoaderPlugin, VRMUtils, VRMExpressionPresetName } from "@pixiv/three-vrm";

export type AnimState = "idle" | "walk" | "run" | "jump" | "wave" | "dance" | "bow";
export type EmotionState = "neutral" | "happy" | "sad" | "angry" | "surprised" | "relaxed";

interface Props {
  vrmUrl: string;
  animation?: AnimState;
  emotion?: EmotionState;
  mouthOpen?: number;
  isSpeaking?: boolean;
  enableMouseTracking?: boolean;
  onLoad?: () => void;
}

const EMOTION_MAP: Partial<Record<EmotionState, Partial<Record<string, number>>>> = {
  happy:     { happy: 0.8 },
  sad:       { sad: 0.8 },
  angry:     { angry: 0.8 },
  surprised: { surprised: 0.9 },
  relaxed:   { relaxed: 0.7 },
};

function applyAnimation(vrm: VRM, anim: AnimState, t: number, delta: number) {
  const h = vrm.humanoid;
  if (!h) return;
  const get = (name: string) => h.getNormalizedBoneNode(name as any);
  const lerp = (node: THREE.Object3D | null, axis: "x"|"y"|"z", target: number, speed = 8) => {
    if (!node) return;
    (node.rotation as any)[axis] = THREE.MathUtils.lerp((node.rotation as any)[axis], target, delta * speed);
  };
  const spine = get("spine"); const chest = get("chest"); const head = get("head");
  const lArm = get("leftUpperArm"); const rArm = get("rightUpperArm");
  const lFore = get("leftLowerArm"); const rFore = get("rightLowerArm");
  const lLeg = get("leftUpperLeg"); const rLeg = get("rightUpperLeg");
  const lKnee = get("leftLowerLeg"); const rKnee = get("rightLowerLeg");
  const lFoot = get("leftFoot"); const rFoot = get("rightFoot");
  const hips = get("hips");
  switch (anim) {
    case "idle": {
      const b = Math.sin(t * 1.4) * 0.012;
      if (hips) hips.position.y = Math.sin(t * 1.4) * 0.008;
      if (spine) { lerp(spine,"x",b,6); lerp(spine,"z",Math.sin(t*0.7)*0.01,4); }
      if (head) { lerp(head,"y",Math.sin(t*0.5)*0.06,3); lerp(head,"z",Math.sin(t*0.7)*0.02,3); }
      if (lArm) { lerp(lArm,"z",0.3,6); lerp(lArm,"x",0.05,6); }
      if (rArm) { lerp(rArm,"z",-0.3,6); lerp(rArm,"x",0.05,6); }
      if (lFore) lerp(lFore,"z",0.1,6); if (rFore) lerp(rFore,"z",-0.1,6);
      if (lLeg) lerp(lLeg,"x",0,6); if (rLeg) lerp(rLeg,"x",0,6);
      break;
    }
    case "walk": {
      const sw = Math.sin(t*5.5);
      if (hips) hips.position.y = Math.abs(Math.sin(t*11))*0.03;
      if (spine) lerp(spine,"z",sw*0.04,10); if (head) lerp(head,"y",sw*0.04,8);
      if (lArm) { lerp(lArm,"x",sw*0.5,10); lerp(lArm,"z",0.15,8); }
      if (rArm) { lerp(rArm,"x",-sw*0.5,10); lerp(rArm,"z",-0.15,8); }
      if (lLeg) lerp(lLeg,"x",-sw*0.55,10); if (rLeg) lerp(rLeg,"x",sw*0.55,10);
      if (lKnee) lerp(lKnee,"x",Math.max(0,-sw)*0.5,10); if (rKnee) lerp(rKnee,"x",Math.max(0,sw)*0.5,10);
      if (lFoot) lerp(lFoot,"x",sw*0.15,10); if (rFoot) lerp(rFoot,"x",-sw*0.15,10);
      break;
    }
    case "run": {
      const sw = Math.sin(t*9);
      if (hips) hips.position.y = Math.abs(Math.sin(t*18))*0.05;
      if (spine) { lerp(spine,"x",-0.12,8); lerp(spine,"z",sw*0.06,12); }
      if (lArm) { lerp(lArm,"x",sw*0.85,12); lerp(lArm,"z",0.25,8); }
      if (rArm) { lerp(rArm,"x",-sw*0.85,12); lerp(rArm,"z",-0.25,8); }
      if (lLeg) lerp(lLeg,"x",-sw*0.95,12); if (rLeg) lerp(rLeg,"x",sw*0.95,12);
      if (lKnee) lerp(lKnee,"x",Math.max(0,-sw)*0.8,12); if (rKnee) lerp(rKnee,"x",Math.max(0,sw)*0.8,12);
      break;
    }
    case "jump": {
      if (spine) lerp(spine,"x",-0.2,8);
      if (lArm) { lerp(lArm,"x",-1.1,8); lerp(lArm,"z",0.5,8); }
      if (rArm) { lerp(rArm,"x",-1.1,8); lerp(rArm,"z",-0.5,8); }
      if (lLeg) lerp(lLeg,"x",-0.35,8); if (rLeg) lerp(rLeg,"x",-0.35,8);
      if (lKnee) lerp(lKnee,"x",0.6,8); if (rKnee) lerp(rKnee,"x",0.6,8);
      break;
    }
    case "wave": {
      if (rArm) { lerp(rArm,"x",-1.2,8); lerp(rArm,"z",-0.3+Math.sin(t*7)*0.4,12); }
      if (lArm) { lerp(lArm,"x",0,6); lerp(lArm,"z",0.2,6); }
      if (head) lerp(head,"y",Math.sin(t*2)*0.1,4);
      break;
    }
    case "dance": {
      const f = 3.5;
      if (hips) { hips.rotation.y = Math.sin(t*f)*0.3; hips.position.y = Math.abs(Math.sin(t*f*2))*0.06; }
      if (lArm) { lerp(lArm,"x",Math.sin(t*f)*0.8,10); lerp(lArm,"z",0.5+Math.sin(t*f*0.5)*0.3,10); }
      if (rArm) { lerp(rArm,"x",-Math.sin(t*f)*0.8,10); lerp(rArm,"z",-0.5-Math.sin(t*f*0.5)*0.3,10); }
      if (lLeg) lerp(lLeg,"x",Math.sin(t*f*2)*0.3,10); if (rLeg) lerp(rLeg,"x",-Math.sin(t*f*2)*0.3,10);
      if (head) lerp(head,"z",Math.sin(t*f)*0.1,6);
      break;
    }
    case "bow": {
      const ba = Math.min(0.7, t*1.5);
      if (spine) lerp(spine,"x",ba*0.5,4); if (chest) lerp(chest,"x",ba*0.3,4);
      if (head) lerp(head,"x",ba*0.4,4);
      if (lArm) { lerp(lArm,"x",0.3,4); lerp(lArm,"z",0.4,4); }
      if (rArm) { lerp(rArm,"x",0.3,4); lerp(rArm,"z",-0.4,4); }
      break;
    }
  }
}

export default function VRMAvatar({ vrmUrl, animation = "idle", emotion = "neutral", mouthOpen = 0, isSpeaking = false, enableMouseTracking = false, onLoad }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const vrmRef = useRef<VRM | null>(null);
  const clockRef = useRef(new THREE.Clock());
  const blinkTimer = useRef(0);
  const blinkVal = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const headTarget = useRef({ x: 0, y: 0 });
  const { gl } = useThree();

  useEffect(() => {
    if (!enableMouseTracking) return;
    const onMove = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [enableMouseTracking, gl]);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    loader.register((p) => new VRMLoaderPlugin(p));
    loader.load(vrmUrl, (gltf) => {
      if (cancelled) return;
      const vrm = gltf.userData.vrm as VRM;
      if (!vrm) return;
      VRMUtils.removeUnnecessaryVertices(vrm.scene);
      VRMUtils.combineSkeletons(vrm.scene);
      VRMUtils.rotateVRM0(vrm);
      vrm.scene.position.set(0, -0.9, 0);
      vrmRef.current = vrm;
      groupRef.current?.add(vrm.scene);
      onLoad?.();
    }, undefined, (err) => console.error("VRM load error:", err));
    return () => {
      cancelled = true;
      if (vrmRef.current) { groupRef.current?.remove(vrmRef.current.scene); vrmRef.current = null; }
    };
  }, [vrmUrl]);

  useFrame((_, delta) => {
    const vrm = vrmRef.current;
    if (!vrm) return;
    const t = clockRef.current.getElapsedTime();
    vrm.update(delta);
    blinkTimer.current += delta;
    if (blinkTimer.current > 3.5 + Math.random() * 2) { blinkTimer.current = 0; blinkVal.current = 1; }
    if (blinkVal.current > 0) blinkVal.current = Math.max(0, blinkVal.current - delta * 8);
    if (vrm.expressionManager) {
      try {
        vrm.expressionManager.setValue(VRMExpressionPresetName.Blink, blinkVal.current);
        const emotionExprs = EMOTION_MAP[emotion] ?? {};
        ["happy","sad","angry","surprised","relaxed"].forEach((k) => {
          try { vrm.expressionManager!.setValue(k as any, (emotionExprs as any)[k] ?? 0); } catch {}
        });
        const mv = isSpeaking ? Math.max(mouthOpen, Math.abs(Math.sin(t*12))*0.4) : mouthOpen;
        vrm.expressionManager.setValue(VRMExpressionPresetName.Aa, mv);
      } catch {}
    }
    if (enableMouseTracking) {
      headTarget.current.x = THREE.MathUtils.lerp(headTarget.current.x, mouseRef.current.y * 0.25, 0.04);
      headTarget.current.y = THREE.MathUtils.lerp(headTarget.current.y, mouseRef.current.x * 0.35, 0.04);
      const head = vrm.humanoid?.getNormalizedBoneNode("head");
      if (head) {
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, headTarget.current.x, 0.1);
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, headTarget.current.y, 0.1);
      }
    }
    applyAnimation(vrm, animation, t, delta);
  });

  return <group ref={groupRef} />;
}
