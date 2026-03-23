"use client";

import { X, Star, Coins, Sparkles, ShoppingBag } from "lucide-react";

export interface FurnitureItemData {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  price?: number;
  icon?: string;
}

const RARITY_CONFIG = {
  common:    { label: "Thường",    color: "text-slate-300",  bg: "bg-slate-700/60",  border: "border-slate-500/40",  glow: "" },
  rare:      { label: "Hiếm",      color: "text-blue-300",   bg: "bg-blue-900/40",   border: "border-blue-500/40",   glow: "shadow-blue-500/20" },
  epic:      { label: "Sử thi",    color: "text-purple-300", bg: "bg-purple-900/40", border: "border-purple-500/40", glow: "shadow-purple-500/30" },
  legendary: { label: "Huyền thoại", color: "text-yellow-300", bg: "bg-yellow-900/30", border: "border-yellow-500/50", glow: "shadow-yellow-500/40" },
};

const RARITY_STARS = { common: 1, rare: 2, epic: 3, legendary: 4 };

interface Props {
  item: FurnitureItemData;
  onClose: () => void;
  onInteract?: () => void;
}

export default function ItemInfoPanel({ item, onClose, onInteract }: Props) {
  const r = RARITY_CONFIG[item.rarity];
  const stars = RARITY_STARS[item.rarity];

  return (
    <div
      className={`fixed right-4 top-20 w-72 rounded-2xl border backdrop-blur-xl shadow-2xl z-30 overflow-hidden ${r.bg} ${r.border} ${r.glow ? `shadow-lg ${r.glow}` : ""}`}
      style={{ background: "rgba(10,8,20,0.82)" }}
    >
      {/* Header */}
      <div className="relative px-4 pt-4 pb-3 border-b border-white/10">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
        >
          <X size={12} />
        </button>

        {/* Icon */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl mb-2 border ${r.border} ${r.bg}`}>
          {item.icon ?? "🪑"}
        </div>

        <h2 className="text-white font-bold text-base leading-tight">{item.name}</h2>

        {/* Rarity stars */}
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} size={11} className={`fill-current ${r.color}`} />
          ))}
          <span className={`text-xs ml-1 font-medium ${r.color}`}>{r.label}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-sm text-white/70 leading-relaxed">{item.description}</p>

        <div className="flex items-center justify-between text-xs text-white/50">
          <span className="flex items-center gap-1">
            <Sparkles size={11} className="text-purple-400" />
            {item.type}
          </span>
          {item.price !== undefined && (
            <span className="flex items-center gap-1 text-yellow-300">
              <Coins size={11} />
              {item.price.toLocaleString()}
            </span>
          )}
        </div>

        {onInteract && (
          <button
            onClick={onInteract}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={14} />
            Tương tác
          </button>
        )}
      </div>
    </div>
  );
}
