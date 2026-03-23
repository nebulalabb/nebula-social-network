"use client";

import { X, Wand2 } from "lucide-react";
import CharacterCreator from "./CharacterCreator";

interface Props {
  onClose: () => void;
}

export default function CharacterCreatorModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl mx-4 h-[85vh] bg-[#0a0618] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 size={18} className="text-violet-400" />
            <h2 className="text-white font-bold text-lg">Tạo nhân vật</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <CharacterCreator />
        </div>
      </div>
    </div>
  );
}
