/**
 * FBXRetargetLoader — load Mixamo FBX animation và retarget sang VRM humanoid bone names.
 *
 * Mixamo dùng tên kiểu "mixamorig:Hips", VRM dùng "hips".
 * File này map và tạo AnimationClip mới có thể dùng với VRM AnimationMixer.
 */

import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import type { VRM } from "@pixiv/three-vrm";

// Mixamo bone name → VRM humanoid bone name
const MIXAMO_TO_VRM: Record<string, string> = {
  "mixamorigHips":             "hips",
  "mixamorigSpine":            "spine",
  "mixamorigSpine1":           "chest",
  "mixamorigSpine2":           "upperChest",
  "mixamorigNeck":             "neck",
  "mixamorigHead":             "head",
  "mixamorigLeftShoulder":     "leftShoulder",
  "mixamorigLeftArm":          "leftUpperArm",
  "mixamorigLeftForeArm":      "leftLowerArm",
  "mixamorigLeftHand":         "leftHand",
  "mixamorigRightShoulder":    "rightShoulder",
  "mixamorigRightArm":         "rightUpperArm",
  "mixamorigRightForeArm":     "rightLowerArm",
  "mixamorigRightHand":        "rightHand",
  "mixamorigLeftUpLeg":        "leftUpperLeg",
  "mixamorigLeftLeg":          "leftLowerLeg",
  "mixamorigLeftFoot":         "leftFoot",
  "mixamorigLeftToeBase":      "leftToes",
  "mixamorigRightUpLeg":       "rightUpperLeg",
  "mixamorigRightLeg":         "rightLowerLeg",
  "mixamorigRightFoot":        "rightFoot",
  "mixamorigRightToeBase":     "rightToes",
  // Fingers (optional)
  "mixamorigLeftHandThumb1":   "leftThumbProximal",
  "mixamorigLeftHandThumb2":   "leftThumbIntermediate",
  "mixamorigLeftHandThumb3":   "leftThumbDistal",
  "mixamorigLeftHandIndex1":   "leftIndexProximal",
  "mixamorigLeftHandIndex2":   "leftIndexIntermediate",
  "mixamorigLeftHandIndex3":   "leftIndexDistal",
  "mixamorigRightHandThumb1":  "rightThumbProximal",
  "mixamorigRightHandThumb2":  "rightThumbIntermediate",
  "mixamorigRightHandThumb3":  "rightThumbDistal",
  "mixamorigRightHandIndex1":  "rightIndexProximal",
  "mixamorigRightHandIndex2":  "rightIndexIntermediate",
  "mixamorigRightHandIndex3":  "rightIndexDistal",
};

/**
 * Retarget một AnimationClip từ Mixamo sang VRM humanoid normalized bones.
 * Trả về clip mới với track names đúng với VRM.
 */
export function retargetClipToVRM(
  clip: THREE.AnimationClip,
  vrm: VRM,
  clipName?: string
): THREE.AnimationClip | null {
  const tracks: THREE.KeyframeTrack[] = [];

  for (const track of clip.tracks) {
    // track.name format: "mixamorigHips.quaternion" hoặc "mixamorigHips.position"
    const dotIdx = track.name.lastIndexOf(".");
    if (dotIdx === -1) continue;

    const boneName = track.name.slice(0, dotIdx);
    const property = track.name.slice(dotIdx + 1);

    // Tìm VRM bone name tương ứng
    const vrmBoneName = MIXAMO_TO_VRM[boneName];
    if (!vrmBoneName) continue;

    // Lấy normalized bone node từ VRM
    const boneNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName as any);
    if (!boneNode) continue;

    // Chỉ lấy rotation (quaternion) — position chỉ giữ hips
    if (property === "quaternion") {
      const newTrack = new THREE.QuaternionKeyframeTrack(
        `${boneNode.name}.quaternion`,
        (track as THREE.QuaternionKeyframeTrack).times,
        (track as THREE.QuaternionKeyframeTrack).values
      );
      tracks.push(newTrack);
    } else if (property === "position" && vrmBoneName === "hips") {
      // Scale position từ Mixamo (cm) sang VRM (m)
      const times = (track as THREE.VectorKeyframeTrack).times;
      const values = (track as THREE.VectorKeyframeTrack).values.slice();
      for (let i = 0; i < values.length; i++) {
        values[i] *= 0.01; // cm → m
      }
      const newTrack = new THREE.VectorKeyframeTrack(
        `${boneNode.name}.position`,
        times,
        values
      );
      tracks.push(newTrack);
    }
  }

  if (tracks.length === 0) return null;

  return new THREE.AnimationClip(clipName ?? clip.name, clip.duration, tracks);
}

/**
 * Load một file FBX và trả về AnimationClip đã retarget cho VRM.
 */
export async function loadFBXAnimation(
  url: string,
  vrm: VRM,
  clipName?: string
): Promise<THREE.AnimationClip | null> {
  return new Promise((resolve) => {
    const loader = new FBXLoader();
    loader.load(
      url,
      (fbx) => {
        if (!fbx.animations || fbx.animations.length === 0) {
          console.warn(`[FBXRetarget] No animations in ${url}`);
          resolve(null);
          return;
        }
        const clip = retargetClipToVRM(fbx.animations[0], vrm, clipName);
        resolve(clip);
      },
      undefined,
      (err) => {
        console.error(`[FBXRetarget] Failed to load ${url}:`, err);
        resolve(null);
      }
    );
  });
}

/**
 * Load nhiều FBX animations cùng lúc.
 */
export async function loadFBXAnimations(
  entries: { url: string; name: string }[],
  vrm: VRM
): Promise<Record<string, THREE.AnimationClip>> {
  const results = await Promise.all(
    entries.map(({ url, name }) => loadFBXAnimation(url, vrm, name))
  );
  const clips: Record<string, THREE.AnimationClip> = {};
  entries.forEach(({ name }, i) => {
    if (results[i]) clips[name] = results[i]!;
  });
  return clips;
}
