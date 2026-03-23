"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Anime-style post processing via CSS + Three.js native effects
// Uses canvas overlay for vignette + CSS filter for bloom simulation

interface PostProcessingProps {
  quality?: string;
  bloom?: boolean;
  vignette?: boolean;
}

// Vignette overlay rendered as a DOM element over the canvas
export function VignetteOverlay({ intensity = 0.5 }: { intensity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-[5]"
      style={{
        background: `radial-gradient(ellipse at center, transparent 55%, rgba(30,10,60,${intensity * 0.7}) 100%)`,
      }}
    />
  );
}

// Anime color grading via tone mapping + exposure tweaks
function AnimeColorGrading({ quality }: { quality?: string }) {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = quality === "high" ? 1.25 : 1.1;
  }, [gl, quality]);

  return null;
}

// Subtle screen-space bloom via emissive intensity pulsing on key objects
// Real bloom requires @react-three/postprocessing which has WebGL context issues
// Instead we boost emissive materials and use CSS filter on the canvas wrapper

export default function PostProcessing({ quality = "medium", bloom = true, vignette = true }: PostProcessingProps) {
  return (
    <>
      <AnimeColorGrading quality={quality} />
    </>
  );
}
