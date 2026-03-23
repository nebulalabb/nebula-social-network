"use client";

import { Mic, MicOff, PhoneOff, Phone } from "lucide-react";

interface VoiceBarProps {
  isActive: boolean;
  isMuted: boolean;
  onStart: () => void;
  onStop: () => void;
  onToggleMute: () => void;
}

export default function VoiceBar({ isActive, isMuted, onStart, onStop, onToggleMute }: VoiceBarProps) {
  return (
    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/10">
      {!isActive ? (
        <button
          onClick={onStart}
          title="Bật voice chat"
          className="flex items-center gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <Phone size={12} />
          Voice
        </button>
      ) : (
        <>
          <button
            onClick={onToggleMute}
            title={isMuted ? "Bỏ tắt mic" : "Tắt mic"}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              isMuted
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-white/10 hover:bg-white/20 text-white"
            }`}
          >
            {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
          </button>
          <button
            onClick={onStop}
            title="Thoát voice"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <PhoneOff size={14} />
          </button>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isMuted ? "bg-red-400" : "bg-green-400 animate-pulse"}`} />
            <span className="text-[10px] text-slate-300">{isMuted ? "Đã tắt mic" : "Đang phát"}</span>
          </div>
        </>
      )}
    </div>
  );
}
