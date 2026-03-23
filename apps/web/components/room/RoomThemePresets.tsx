"use client";

import { useState } from "react";
import { X, Check, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../lib/api-client";
import { toast } from "sonner";

export interface RoomTheme {
  id: string;
  name: string;
  description: string;
  emoji: string;
  bgColor: string;
  wallColor: string;
  floorColor: string;
  accentColor: string;
  fogColor: string;
  ambientColor: string;
  rimColor: string;
  preview: string; // gradient CSS
}

export const ROOM_THEMES: RoomTheme[] = [
  {
    id: "default",
    name: "Anime Pastel",
    description: "Phòng anime cổ điển với tông màu pastel nhẹ nhàng",
    emoji: "🌸",
    bgColor: "#ede9fe",
    wallColor: "#ede9fe",
    floorColor: "#fdf4ff",
    accentColor: "#7c3aed",
    fogColor: "#ede9fe",
    ambientColor: "#c4b5fd",
    rimColor: "#7dd3fc",
    preview: "linear-gradient(135deg, #ede9fe, #fce7f3)",
  },
  {
    id: "sakura",
    name: "Sakura Garden",
    description: "Phòng mùa xuân với hoa anh đào và ánh sáng hồng",
    emoji: "🌺",
    bgColor: "#fdf2f8",
    wallColor: "#fce7f3",
    floorColor: "#fdf2f8",
    accentColor: "#ec4899",
    fogColor: "#fce7f3",
    ambientColor: "#fbcfe8",
    rimColor: "#f9a8d4",
    preview: "linear-gradient(135deg, #fce7f3, #fdf2f8)",
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    description: "Phòng đêm huyền bí với ánh sao và màu xanh đậm",
    emoji: "🌙",
    bgColor: "#0f172a",
    wallColor: "#1e1b4b",
    floorColor: "#0f172a",
    accentColor: "#6366f1",
    fogColor: "#1e1b4b",
    ambientColor: "#4338ca",
    rimColor: "#818cf8",
    preview: "linear-gradient(135deg, #1e1b4b, #0f172a)",
  },
  {
    id: "forest",
    name: "Enchanted Forest",
    description: "Phòng rừng ma thuật với màu xanh lá và ánh sáng thần tiên",
    emoji: "🌿",
    bgColor: "#f0fdf4",
    wallColor: "#dcfce7",
    floorColor: "#f0fdf4",
    accentColor: "#16a34a",
    fogColor: "#dcfce7",
    ambientColor: "#86efac",
    rimColor: "#4ade80",
    preview: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
  },
  {
    id: "sunset",
    name: "Anime Sunset",
    description: "Phòng hoàng hôn với tông cam vàng ấm áp",
    emoji: "🌅",
    bgColor: "#fff7ed",
    wallColor: "#ffedd5",
    floorColor: "#fff7ed",
    accentColor: "#ea580c",
    fogColor: "#ffedd5",
    ambientColor: "#fed7aa",
    rimColor: "#fb923c",
    preview: "linear-gradient(135deg, #ffedd5, #fef3c7)",
  },
  {
    id: "cyberpunk",
    name: "Cyber Neon",
    description: "Phòng cyberpunk với ánh đèn neon rực rỡ",
    emoji: "⚡",
    bgColor: "#0a0a0f",
    wallColor: "#0d0d1a",
    floorColor: "#0a0a0f",
    accentColor: "#a855f7",
    fogColor: "#0d0d1a",
    ambientColor: "#7c3aed",
    rimColor: "#06b6d4",
    preview: "linear-gradient(135deg, #0d0d1a, #1a0a2e)",
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    description: "Phòng đại dương sâu thẳm với màu xanh biển",
    emoji: "🌊",
    bgColor: "#eff6ff",
    wallColor: "#dbeafe",
    floorColor: "#eff6ff",
    accentColor: "#2563eb",
    fogColor: "#dbeafe",
    ambientColor: "#93c5fd",
    rimColor: "#38bdf8",
    preview: "linear-gradient(135deg, #dbeafe, #eff6ff)",
  },
  {
    id: "autumn",
    name: "Autumn Leaves",
    description: "Phòng mùa thu với lá vàng đỏ rực rỡ",
    emoji: "🍂",
    bgColor: "#fefce8",
    wallColor: "#fef9c3",
    floorColor: "#fefce8",
    accentColor: "#ca8a04",
    fogColor: "#fef9c3",
    ambientColor: "#fde68a",
    rimColor: "#f97316",
    preview: "linear-gradient(135deg, #fef9c3, #ffedd5)",
  },
];

interface RoomThemePresetsProps {
  roomId: string;
  currentTheme?: string;
  onApply: (theme: RoomTheme) => void;
  onClose: () => void;
}

export default function RoomThemePresets({ roomId, currentTheme = "default", onApply, onClose }: RoomThemePresetsProps) {
  const [selected, setSelected] = useState(currentTheme);
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (themeId: string) => apiClient.put(`/rooms/${roomId}`, { theme: themeId }),
    onSuccess: () => {
      toast.success("Đã áp dụng theme phòng!");
      qc.invalidateQueries({ queryKey: ["room", roomId] });
    },
    onError: () => toast.error("Lưu theme thất bại"),
  });

  const handleApply = () => {
    const theme = ROOM_THEMES.find((t) => t.id === selected);
    if (!theme) return;
    saveMutation.mutate(selected);
    onApply(theme);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1a0a2e]/95 border border-purple-500/30 rounded-2xl p-5 w-[560px] max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-pink-400" />
            <span className="text-white font-semibold">Theme phòng</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Theme grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {ROOM_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelected(theme.id)}
              className={`relative p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                selected === theme.id
                  ? "border-pink-500 bg-pink-900/20 shadow-lg shadow-pink-500/20"
                  : "border-white/10 bg-white/5 hover:border-white/30"
              }`}
            >
              {/* Preview swatch */}
              <div
                className="w-full h-14 rounded-lg mb-2 relative overflow-hidden"
                style={{ background: theme.preview }}
              >
                {/* Mini room preview dots */}
                <div className="absolute inset-0 flex items-end justify-center pb-1 gap-1">
                  <div className="w-3 h-4 rounded-sm opacity-60" style={{ backgroundColor: theme.accentColor }} />
                  <div className="w-5 h-6 rounded-sm opacity-80" style={{ backgroundColor: theme.accentColor }} />
                  <div className="w-3 h-4 rounded-sm opacity-60" style={{ backgroundColor: theme.accentColor }} />
                </div>
                <div className="absolute top-1 right-1 text-base">{theme.emoji}</div>
              </div>

              <div className="flex items-start justify-between gap-1">
                <div>
                  <p className="text-sm font-semibold text-white">{theme.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{theme.description}</p>
                </div>
                {selected === theme.id && (
                  <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </div>

              {/* Color dots */}
              <div className="flex gap-1 mt-2">
                {[theme.wallColor, theme.accentColor, theme.ambientColor, theme.rimColor].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/20 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleApply}
            disabled={saveMutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? "Đang áp dụng..." : "Áp dụng theme"}
          </button>
        </div>
      </div>
    </div>
  );
}
