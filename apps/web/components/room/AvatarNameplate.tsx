"use client";

import { Html, Billboard } from "@react-three/drei";

type Props = {
  name: string;
  level?: number;
  isSpeaking?: boolean;
  emote?: string | null;
};

export default function AvatarNameplate({ name, level = 1, isSpeaking = false, emote }: Props) {
  return (
    <Billboard>
      <Html position={[0, 2.4, 0]} center distanceFactor={10} transform>
        <div className="flex flex-col items-center gap-1 pointer-events-none select-none">
          {/* Emote bubble */}
          {emote && (
            <div className="text-2xl animate-bounce mb-0.5 drop-shadow-lg">{emote}</div>
          )}

          {/* Speaking wave */}
          {isSpeaking && (
            <div className="flex items-end gap-0.5 h-4 mb-0.5">
              {[1, 2, 3, 2, 1].map((h, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-emerald-400"
                  style={{
                    height: `${h * 4}px`,
                    animation: `pulse ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Name tag */}
          <div
            className="rounded-xl px-3 py-1.5 text-center shadow-xl"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.85) 0%, rgba(236,72,153,0.85) 100%)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              minWidth: 90,
            }}
          >
            <div className="text-white text-xs font-bold leading-tight tracking-wide drop-shadow">
              {name}
            </div>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isSpeaking ? "bg-emerald-400" : "bg-white/40"
                }`}
                style={isSpeaking ? { animation: "pulse 1s ease-in-out infinite" } : {}}
              />
              <span className="text-[9px] text-white/70 font-medium">Lv.{level}</span>
            </div>
          </div>
        </div>
      </Html>
    </Billboard>
  );
}
