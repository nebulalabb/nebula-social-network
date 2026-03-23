"use client";

import { useState, useCallback } from "react";
import { Camera, X, Download, Aperture, Sun, Contrast, Sparkles } from "lucide-react";

interface PhotoModeOverlayProps {
  onClose: () => void;
}

const FILTERS = [
  { id: "none", label: "Gốc", css: "" },
  { id: "anime", label: "Anime", css: "saturate(1.4) contrast(1.1) brightness(1.05)" },
  { id: "pastel", label: "Pastel", css: "saturate(0.8) brightness(1.15) hue-rotate(10deg)" },
  { id: "vivid", label: "Vivid", css: "saturate(1.8) contrast(1.2)" },
  { id: "retro", label: "Retro", css: "sepia(0.4) saturate(1.2) contrast(1.1)" },
  { id: "night", label: "Đêm", css: "brightness(0.8) saturate(1.3) hue-rotate(200deg)" },
  { id: "sakura", label: "Sakura", css: "saturate(1.2) hue-rotate(330deg) brightness(1.1)" },
];

const FRAMES = [
  { id: "none", label: "Không" },
  { id: "anime", label: "Anime" },
  { id: "sakura", label: "Sakura" },
  { id: "polaroid", label: "Polaroid" },
];

export default function PhotoModeOverlay({ onClose }: PhotoModeOverlayProps) {
  const [filter, setFilter] = useState("anime");
  const [frame, setFrame] = useState("none");
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(120);
  const [captured, setCaptured] = useState<string | null>(null);

  const takePhoto = useCallback(() => {
    // Find the Three.js canvas and capture it
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      setCaptured(dataUrl);
    } catch {
      // Canvas may be tainted — try anyway
    }
  }, []);

  const download = useCallback(() => {
    if (!captured) return;
    const a = document.createElement("a");
    a.href = captured;
    a.download = `anime-room-${Date.now()}.png`;
    a.click();
  }, [captured]);

  const activeFilter = FILTERS.find((f) => f.id === filter);
  const cssFilter = [
    activeFilter?.css ?? "",
    `brightness(${brightness}%)`,
    `saturate(${saturation}%)`,
  ].filter(Boolean).join(" ");

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a0a2e]/95 border border-purple-500/30 rounded-2xl p-5 w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-pink-400" />
            <span className="text-white font-semibold">Chế độ ảnh</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 border border-purple-500/20 bg-black/40">
          {captured ? (
            <img
              src={captured}
              alt="Ảnh chụp"
              className="w-full h-full object-cover"
              style={{ filter: cssFilter }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Camera size={32} className="text-purple-400 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Nhấn chụp để xem trước</p>
              </div>
            </div>
          )}
          {/* Frame overlays */}
          {frame === "polaroid" && captured && (
            <div className="absolute inset-0 border-[14px] border-b-[28px] border-white/90 pointer-events-none" />
          )}
          {frame === "anime" && captured && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500" />
              <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500" />
              <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-pink-400" />
              <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
              <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
              <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-pink-400" />
            </div>
          )}
          {frame === "sakura" && captured && (
            <div className="absolute inset-0 pointer-events-none border-[8px] border-pink-300/50 rounded-xl" />
          )}
        </div>

        {/* Filters */}
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
            <Sparkles size={12} className="text-pink-400" /> Bộ lọc
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f.id
                    ? "bg-pink-600 text-white"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Frames */}
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2">Khung ảnh</p>
          <div className="flex gap-2 flex-wrap">
            {FRAMES.map((f) => (
              <button
                key={f.id}
                onClick={() => setFrame(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  frame === f.id
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Adjustments */}
        <div className="space-y-3 mb-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Sun size={11} /> Độ sáng
              </span>
              <span className="text-xs text-slate-400">{brightness}%</span>
            </div>
            <input
              type="range" min={50} max={150} value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-pink-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Contrast size={11} /> Độ bão hòa
              </span>
              <span className="text-xs text-slate-400">{saturation}%</span>
            </div>
            <input
              type="range" min={0} max={200} value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={takePhoto}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition-colors"
          >
            <Aperture size={16} /> Chụp ảnh
          </button>
          {captured && (
            <button
              onClick={download}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
            >
              <Download size={16} /> Tải xuống
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
