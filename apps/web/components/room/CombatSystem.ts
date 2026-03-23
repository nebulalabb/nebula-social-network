/**
 * CombatSystem — HP, attack, skill, hit detection cho room game.
 * Dùng EventEmitter pattern để notify UI và socket.
 */

import * as THREE from "three";

export type CombatEvent =
  | { type: "damage"; targetId: string; amount: number; attackerId: string }
  | { type: "heal"; targetId: string; amount: number }
  | { type: "death"; targetId: string }
  | { type: "skill"; casterId: string; skillId: string; position: THREE.Vector3 }
  | { type: "hit_effect"; position: THREE.Vector3; color: string };

export type SkillDef = {
  id: string;
  name: string;
  damage: number;
  range: number;
  cooldown: number; // seconds
  color: string;
  aoe: boolean;
};

export const SKILLS: SkillDef[] = [
  { id: "slash",   name: "Chém",       damage: 15, range: 2.5, cooldown: 0.8,  color: "#60a5fa", aoe: false },
  { id: "blast",   name: "Nổ",         damage: 30, range: 4.0, cooldown: 3.0,  color: "#f97316", aoe: true  },
  { id: "heal",    name: "Hồi máu",    damage: -25, range: 0,  cooldown: 5.0,  color: "#4ade80", aoe: false },
  { id: "dash",    name: "Lướt",       damage: 10, range: 3.0, cooldown: 2.0,  color: "#a78bfa", aoe: false },
];

export class CombatSystem {
  id: string;
  maxHp: number;
  hp: number;
  private cooldowns: Map<string, number> = new Map();
  private listeners: ((event: CombatEvent) => void)[] = [];

  constructor(id: string, maxHp = 100) {
    this.id = id;
    this.maxHp = maxHp;
    this.hp = maxHp;
  }

  on(listener: (event: CombatEvent) => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }

  private emit(event: CombatEvent) {
    this.listeners.forEach((l) => l(event));
  }

  takeDamage(amount: number, attackerId: string): boolean {
    if (this.hp <= 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.emit({ type: "damage", targetId: this.id, amount, attackerId });
    if (this.hp <= 0) this.emit({ type: "death", targetId: this.id });
    return true;
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.emit({ type: "heal", targetId: this.id, amount });
  }

  respawn() {
    this.hp = this.maxHp;
    this.cooldowns.clear();
  }

  /** Thử dùng skill — trả về true nếu thành công */
  useSkill(
    skillId: string,
    myPosition: THREE.Vector3,
    targets: { id: string; position: THREE.Vector3; combat: CombatSystem }[],
    now: number
  ): boolean {
    const skill = SKILLS.find((s) => s.id === skillId);
    if (!skill) return false;

    const lastUsed = this.cooldowns.get(skillId) ?? 0;
    if (now - lastUsed < skill.cooldown * 1000) return false;

    this.cooldowns.set(skillId, now);

    this.emit({ type: "skill", casterId: this.id, skillId, position: myPosition.clone() });

    if (skill.id === "heal") {
      this.heal(-skill.damage); // damage âm = heal
      return true;
    }

    // Hit detection
    const hit = targets.filter((t) => {
      const dist = myPosition.distanceTo(t.position);
      return dist <= skill.range && t.id !== this.id;
    });

    if (!skill.aoe && hit.length > 0) {
      // Single target — gần nhất
      const closest = hit.sort((a, b) =>
        myPosition.distanceTo(a.position) - myPosition.distanceTo(b.position)
      )[0];
      closest.combat.takeDamage(skill.damage, this.id);
      this.emit({ type: "hit_effect", position: closest.position.clone(), color: skill.color });
    } else if (skill.aoe) {
      hit.forEach((t) => {
        t.combat.takeDamage(skill.damage, this.id);
        this.emit({ type: "hit_effect", position: t.position.clone(), color: skill.color });
      });
    }

    return true;
  }

  getCooldownRatio(skillId: string, now: number): number {
    const skill = SKILLS.find((s) => s.id === skillId);
    if (!skill) return 0;
    const lastUsed = this.cooldowns.get(skillId) ?? 0;
    const elapsed = (now - lastUsed) / 1000;
    return Math.min(1, elapsed / skill.cooldown);
  }

  isAlive() { return this.hp > 0; }
  getHpRatio() { return this.hp / this.maxHp; }
}
