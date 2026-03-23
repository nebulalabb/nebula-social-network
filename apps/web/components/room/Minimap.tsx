"use client";

import { useEffect, useRef } from "react";
import { RemotePlayer } from "../../hooks/useRoomSocket";

interface MinimapProps {
  playerPos: { x: number; z: number };
  playerRy: number;
  remotePlayers: Map<string, RemotePlayer>;
  size?: number;
  worldSize?: number;
}

export default function Minimap({
  playerPos,
  playerRy,
  remotePlayers,
  size = 120,
  worldSize = 40,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const half = size / 2;
    const scale = size / worldSize;

    // Background
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(half, half, half, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const gridStep = worldSize / 4;
    for (let g = -worldSize / 2; g <= worldSize / 2; g += gridStep) {
      const px = half + g * scale;
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, px); ctx.lineTo(size, px); ctx.stroke();
    }

    // Remote players (blue dots)
    remotePlayers.forEach((p) => {
      if (!p.position) return;
      const rx = half + p.position[0] * scale;
      const rz = half + p.position[2] * scale;
      ctx.beginPath();
      ctx.arc(rx, rz, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#60a5fa";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Local player arrow
    const px = half + playerPos.x * scale;
    const pz = half + playerPos.z * scale;
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(playerRy);
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(4, 5);
    ctx.lineTo(0, 2);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fillStyle = "#f472b6";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Border ring
    ctx.beginPath();
    ctx.arc(half, half, half - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [playerPos, playerRy, remotePlayers, size, worldSize]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full shadow-lg shadow-black/50"
        style={{ display: "block" }}
      />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-white/40 pointer-events-none select-none">
        MAP
      </div>
    </div>
  );
}
