"use client";

import { Settings2 } from "lucide-react";
import { useState } from "react";

export type GraphicsQuality = "low" | "medium" | "high";

interface QualitySettingsProps {
  quality: GraphicsQuality;
  onChange: (q: GraphicsQuality) => void;
}

const LEVELS: { value: GraphicsQuality; label: string; desc: string }[] = [
  { value: "low", label: "Thấp", desc: "Mượt nhất, ít hiệu ứng" },
  { value: "medium", label: "Trung bình", desc: "Cân bằng" },
  { value: "high", label: "Cao", desc: "Đẹp nhất, cần GPU tốt" },
];

export default function QualitySettings({ quality, onChange }: QualitySettingsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-white/10 text-white hover:bg-white/20 transition-colors"
        title="Chất lượng đồ họa"
      >
        <Settings2 size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-12 bg-black/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden w-52">
          <div className="px-3 py-2 border-b border-white/10">
            <span className="text-xs text-white font-semibold">Chất lượng đồ họa</span>
          </div>
          {LEVELS.map((l) => (
            <button
              key={l.value}
              onClick={() => { onChange(l.value); setOpen(false); }}
              className={`w-full flex flex-col px-3 py-2.5 text-left transition-colors ${
                quality === l.value ? "bg-pink-600/30 text-pink-300" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <span className="text-xs font-medium">{l.label}</span>
              <span className="text-[10px] text-slate-400">{l.desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
