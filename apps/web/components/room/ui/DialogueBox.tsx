"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

export interface DialogueNode {
  id: string;
  speaker: string;
  speakerIcon?: string;
  text: string;
  next?: string;
}

export interface DialogueTree {
  start: string;
  nodes: Record<string, DialogueNode>;
}

interface Props {
  tree: DialogueTree;
  onFinish?: () => void;
}

export default function DialogueBox({ tree, onFinish }: Props) {
  const [nodeId, setNodeId] = useState(tree.start);
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  const node = tree.nodes[nodeId];

  // Typewriter effect
  useEffect(() => {
    if (!node) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(node.text.slice(0, i));
      if (i >= node.text.length) { clearInterval(iv); setDone(true); }
    }, 28);
    return () => clearInterval(iv);
  }, [nodeId, node?.text]);

  if (!node) return null;

  const handleNext = () => {
    if (!done) { setDisplayed(node.text); setDone(true); return; }
    if (node.next) { setNodeId(node.next); }
    else { onFinish?.(); }
  };

  return (
    <div
      onClick={handleNext}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-[min(580px,90vw)] cursor-pointer select-none"
    >
      <div className="rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden"
        style={{ background: "rgba(8,6,18,0.88)" }}>
        {/* Speaker */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/8">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm">
            {node.speakerIcon ?? "✨"}
          </div>
          <span className="text-xs font-bold text-pink-300 tracking-wide uppercase">{node.speaker}</span>
        </div>

        {/* Text */}
        <div className="px-4 py-3 min-h-[52px]">
          <p className="text-sm text-white/90 leading-relaxed">
            {displayed}
            {!done && <span className="animate-pulse text-pink-400">▌</span>}
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 flex justify-end">
          <span className={`flex items-center gap-1 text-[10px] transition-opacity ${done ? "text-white/40 opacity-100" : "opacity-0"}`}>
            {node.next ? "Tiếp tục" : "Đóng"}
            <ChevronRight size={10} className={done ? "animate-bounce" : ""} />
          </span>
        </div>
      </div>
    </div>
  );
}
