"use client";

import { useEffect, useState } from "react";

export default function PointerLockOverlay() {
  const [locked, setLocked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    const onChange = () => setLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  if (locked || isMobile) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
      {/* Gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/70 via-black/60 to-pink-950/70 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-5 text-center px-8">
        {/* Anime character icon */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl shadow-pink-500/30 animate-pulse">
            ✨
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-pink-400 flex items-center justify-center text-xs">
            🎀
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-white text-2xl font-bold tracking-wide drop-shadow-lg">
            Click để vào phòng
          </h2>
          <p className="text-purple-200 text-sm">Anime 3D Social Space</p>
        </div>

        {/* Controls grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ["WASD / ↑↓←→", "Di chuyển"],
            ["Shift", "Chạy nhanh"],
            ["Space", "Nhảy"],
            ["V", "Đổi góc nhìn"],
            ["1-8", "Emote nhanh"],
            ["ESC", "Mở khóa chuột"],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
              <kbd className="bg-white/20 text-white px-1.5 py-0.5 rounded font-mono text-[10px] border border-white/30">
                {key}
              </kbd>
              <span className="text-white/70">{desc}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-pink-300 text-xs animate-bounce">
          <span>🖱️</span>
          <span>Click chuột để bắt đầu</span>
        </div>
      </div>
    </div>
  );
}
