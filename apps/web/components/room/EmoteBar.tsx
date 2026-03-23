"use client";

import { useState, useEffect } from "react";

const EMOTES = [
  { key: "wave",    icon: "👋", label: "Vẫy tay",   hotkey: "1" },
  { key: "dance",   icon: "💃", label: "Nhảy",       hotkey: "2" },
  { key: "bow",     icon: "🙇", label: "Cúi chào",   hotkey: "3" },
  { key: "heart",   icon: "❤️", label: "Tim",         hotkey: "4" },
  { key: "laugh",   icon: "😂", label: "Cười",        hotkey: "5" },
  { key: "angry",   icon: "😡", label: "Tức giận",   hotkey: "6" },
  { key: "sit",     icon: "🪑", label: "Ngồi",        hotkey: "7" },
  { key: "sleep",   icon: "😴", label: "Ngủ",         hotkey: "8" },
  { key: "attack",  icon: "⚔️", label: "Tấn công",   hotkey: "9" },
];

interface EmoteBarProps {
  onEmote: (emote: string) => void;
}

export default function EmoteBar({ onEmote }: EmoteBarProps) {
  const [active, setActive] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      const emote = EMOTES.find((em) => em.hotkey === e.key);
      if (emote) {
        triggerEmote(emote.key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const triggerEmote = (key: string) => {
    setActive(key);
    onEmote(key);
    setTimeout(() => setActive(null), 3000);
  };

  return (
    <div className="relative flex flex-col items-center gap-1">
      {/* Hint toggle */}
      <button
        onClick={() => setShowHints(!showHints)}
        className="text-[10px] text-slate-400 hover:text-white transition-colors"
      >
        {showHints ? "Ẩn phím tắt" : "Phím tắt 1-8"}
      </button>

      <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10 shadow-xl">
        {EMOTES.map(({ key, icon, label, hotkey }) => (
          <div key={key} className="relative group">
            <button
              title={`${label} [${hotkey}]`}
              onClick={() => triggerEmote(key)}
              className={`w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all active:scale-90 ${
                active === key
                  ? "bg-pink-600/60 scale-110 ring-2 ring-pink-400"
                  : "hover:bg-white/20 hover:scale-105"
              }`}
            >
              {icon}
            </button>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
              <div className="bg-black/90 text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap">
                {label}
                {showHints && (
                  <span className="ml-1 text-pink-400 font-bold">[{hotkey}]</span>
                )}
              </div>
              <div className="w-2 h-2 bg-black/90 rotate-45 -mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
