"use client";

import { useEffect, useState } from "react";
import { CombatSystem, SKILLS } from "./CombatSystem";
import { Zap, Heart, Shield } from "lucide-react";

interface Props {
  combat: CombatSystem;
  /** Callback khi player dùng skill */
  onSkill?: (skillId: string) => void;
}

export default function CombatHUD({ combat, onSkill }: Props) {
  const [hp, setHp] = useState(combat.hp);
  const [maxHp] = useState(combat.maxHp);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [dmgFlash, setDmgFlash] = useState(false);

  useEffect(() => {
    const unsub = combat.on((event) => {
      if (event.type === "damage" && event.targetId === combat.id) {
        setHp(combat.hp);
        setDmgFlash(true);
        setTimeout(() => setDmgFlash(false), 300);
      }
      if (event.type === "heal" && event.targetId === combat.id) {
        setHp(combat.hp);
      }
    });
    return unsub;
  }, [combat]);

  // Update cooldowns mỗi 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const cd: Record<string, number> = {};
      SKILLS.forEach((s) => { cd[s.id] = combat.getCooldownRatio(s.id, now); });
      setCooldowns(cd);
    }, 100);
    return () => clearInterval(interval);
  }, [combat]);

  // Keyboard shortcuts: 1-4 cho skills
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < SKILLS.length) {
        onSkill?.(SKILLS[idx].id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSkill]);

  const hpRatio = hp / maxHp;
  const hpColor = hpRatio > 0.6 ? "#4ade80" : hpRatio > 0.3 ? "#facc15" : "#f87171";

  return (
    <div className="absolute bottom-24 left-4 z-20 select-none pointer-events-auto">
      {/* HP Bar */}
      <div className="mb-3 w-48">
        <div className="flex items-center gap-1.5 mb-1">
          <Heart size={12} className="text-red-400" fill="currentColor" />
          <span className="text-xs text-white/70 font-medium">{hp} / {maxHp}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${hpRatio * 100}%`, backgroundColor: hpColor }}
          />
        </div>
      </div>

      {/* Skill bar */}
      <div className="flex gap-2">
        {SKILLS.map((skill, i) => {
          const cd = cooldowns[skill.id] ?? 1;
          const ready = cd >= 1;
          return (
            <button
              key={skill.id}
              onClick={() => onSkill?.(skill.id)}
              className="relative w-12 h-12 rounded-xl border border-white/10 overflow-hidden flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 active:scale-95"
              style={{
                background: ready
                  ? `${skill.color}22`
                  : "rgba(0,0,0,0.4)",
                borderColor: ready ? `${skill.color}60` : "rgba(255,255,255,0.1)",
              }}
              title={`${skill.name} [${i + 1}]`}
            >
              {/* Cooldown overlay */}
              {!ready && (
                <div
                  className="absolute inset-0 bg-black/60"
                  style={{ clipPath: `inset(${(1 - cd) * 100}% 0 0 0)` }}
                />
              )}
              <Zap size={14} style={{ color: skill.color }} />
              <span className="text-[9px] text-white/60 font-medium leading-none">{i + 1}</span>
              {/* Cooldown text */}
              {!ready && (
                <span className="absolute text-[10px] text-white font-bold">
                  {((1 - cd) * SKILLS[i].cooldown).toFixed(1)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Damage flash overlay */}
      {dmgFlash && (
        <div className="fixed inset-0 pointer-events-none z-50 border-4 border-red-500/60 animate-pulse" />
      )}
    </div>
  );
}
