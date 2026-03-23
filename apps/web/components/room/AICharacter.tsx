"use client";

import { useRef, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { AICompanion, NPCConfig } from "./AICompanion";
import VRMAvatar from "./VRMAvatar";
import type { AnimState, EmotionState } from "./VRMAvatar";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Props {
  config: NPCConfig;
  position: [number, number, number];
  vrmUrl?: string;
  playerPosRef: React.RefObject<THREE.Vector3>;
}

const INTERACT_DISTANCE = 3.5;

// Map personality → default emotion
const PERSONALITY_EMOTION: Record<string, EmotionState> = {
  friendly:   "happy",
  tsundere:   "angry",
  wise:       "relaxed",
  energetic:  "surprised",
  mysterious: "neutral",
};

export default function AICharacter({ config, position, vrmUrl, playerPosRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const companionRef = useRef(new AICompanion(config));
  const [isNearby, setIsNearby] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "npc"; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [npcAnim, setNpcAnim] = useState<AnimState>("idle");
  const [npcEmotion, setNpcEmotion] = useState<EmotionState>(
    PERSONALITY_EMOTION[config.personality] ?? "neutral"
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const posVec = useRef(new THREE.Vector3(...position));

  // Floating bob + proximity check
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.04;
    }

    if (playerPosRef.current) {
      const dist = playerPosRef.current.distanceTo(posVec.current);
      setIsNearby(dist < INTERACT_DISTANCE);
    }
  });

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsLoading(true);
    setNpcAnim("idle");

    try {
      const reply = await companionRef.current.chat(text);
      setMessages((prev) => [...prev, { role: "npc", text: reply }]);

      // Animate NPC khi trả lời
      setNpcAnim("wave");
      setIsSpeaking(true);
      setNpcEmotion("happy");

      setTimeout(() => {
        setNpcAnim("idle");
        setIsSpeaking(false);
        setNpcEmotion(PERSONALITY_EMOTION[config.personality] ?? "neutral");
      }, 3000);
    } catch {
      setMessages((prev) => [...prev, { role: "npc", text: "..." }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, config.personality]);

  return (
    <group ref={groupRef} position={position}>
      {/* VRM avatar hoặc fallback capsule */}
      {vrmUrl ? (
        <VRMAvatar
          vrmUrl={vrmUrl}
          animation={npcAnim}
          emotion={npcEmotion}
          isSpeaking={isSpeaking}
        />
      ) : (
        <NPCFallbackMesh color={config.personality === "tsundere" ? "#f472b6" : "#818cf8"} />
      )}

      {/* Proximity indicator */}
      {isNearby && !showChat && (
        <Html position={[0, 2.2, 0]} center>
          <button
            onClick={() => setShowChat(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 border border-white/20 text-white text-xs backdrop-blur-sm hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            <MessageCircle size={12} className="text-pink-400" />
            Nói chuyện với {config.name}
          </button>
        </Html>
      )}

      {/* Floating name */}
      {!showChat && (
        <Html position={[0, 2.6, 0]} center>
          <div className="text-[10px] text-white/60 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none whitespace-nowrap">
            {config.name}
          </div>
        </Html>
      )}

      {/* Chat UI */}
      {showChat && (
        <Html position={[0, 2.8, 0]} center>
          <div className="w-72 bg-[#0d0d1a]/95 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-[10px] text-white font-bold">
                  {config.name[0]}
                </div>
                <span className="text-xs text-white/80 font-medium">{config.name}</span>
                <span className="text-[9px] text-white/30 capitalize">{config.personality}</span>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="h-40 overflow-y-auto p-3 space-y-2 scrollbar-hide">
              {messages.length === 0 && (
                <p className="text-xs text-white/25 text-center mt-4">
                  Hãy nói chuyện với {config.name}...
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-2.5 py-1.5 rounded-xl text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-pink-600/30 text-white/80 rounded-br-sm"
                        : "bg-white/5 text-white/70 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 px-3 py-2 rounded-xl rounded-bl-sm">
                    <Loader2 size={12} className="animate-spin text-white/40" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2 p-2 border-t border-white/[0.06]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-white/5 text-xs text-white/80 placeholder-white/25 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500/40"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-1.5 rounded-lg bg-pink-600/30 hover:bg-pink-600/50 disabled:opacity-30 text-pink-300 transition-colors"
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Fallback mesh khi không có VRM
function NPCFallbackMesh({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow>
        <capsuleGeometry args={[0.22, 0.55, 6, 12]} />
        <meshToonMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshToonMaterial color="#fde68a" />
      </mesh>
    </group>
  );
}
