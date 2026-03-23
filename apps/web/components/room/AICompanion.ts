/**
 * AICompanion — NPC AI với memory, personality, và context-aware responses.
 * Gọi server API /api/ai/npc để lấy response từ LLM.
 */

export type NPCPersonality = "friendly" | "tsundere" | "wise" | "energetic" | "mysterious";

export interface NPCConfig {
  id: string;
  name: string;
  personality: NPCPersonality;
  backstory: string;
  /** Tên anime/manga NPC biết */
  knownAnime?: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const PERSONALITY_PROMPTS: Record<NPCPersonality, string> = {
  friendly:    "Bạn là NPC anime dễ thương, thân thiện, hay cười và dùng emoji. Luôn hỏi thăm người chơi.",
  tsundere:    "Bạn là NPC tsundere — bề ngoài lạnh lùng nhưng thực ra quan tâm. Hay nói 'Baka!' nhưng vẫn giúp đỡ.",
  wise:        "Bạn là NPC hiền triết, nói chuyện sâu sắc, hay trích dẫn triết lý từ anime kinh điển.",
  energetic:   "Bạn là NPC siêu năng lượng, hay dùng dấu chấm than, nói nhanh và hào hứng về mọi thứ!",
  mysterious:  "Bạn là NPC bí ẩn, nói chuyện mơ hồ, hay ám chỉ những điều sâu xa và bí mật.",
};

export class AICompanion {
  config: NPCConfig;
  memory: ChatMessage[] = [];
  private maxMemory = 20; // giữ 20 tin nhắn gần nhất

  constructor(config: NPCConfig) {
    this.config = config;
  }

  /** Gửi tin nhắn và nhận reply từ AI */
  async chat(userMessage: string): Promise<string> {
    this.memory.push({ role: "user", content: userMessage, timestamp: Date.now() });

    try {
      const res = await fetch("/api/ai/npc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcId: this.config.id,
          npcName: this.config.name,
          personality: PERSONALITY_PROMPTS[this.config.personality],
          backstory: this.config.backstory,
          knownAnime: this.config.knownAnime ?? [],
          history: this.memory.slice(-this.maxMemory).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          message: userMessage,
        }),
      });

      if (!res.ok) throw new Error(`AI API error: ${res.status}`);
      const data = await res.json();
      const reply = data.reply ?? "...";

      this.memory.push({ role: "assistant", content: reply, timestamp: Date.now() });
      if (this.memory.length > this.maxMemory * 2) {
        this.memory = this.memory.slice(-this.maxMemory);
      }

      return reply;
    } catch (err) {
      console.error("[AICompanion] chat error:", err);
      return this.getFallbackReply();
    }
  }

  private getFallbackReply(): string {
    const fallbacks: Record<NPCPersonality, string[]> = {
      friendly:   ["Hehe, mình không nghe rõ lắm~ 😊", "Bạn nói gì vậy? Kể mình nghe đi!"],
      tsundere:   ["B-baka! Mình không hiểu bạn nói gì!", "Hmph... nói lại đi."],
      wise:       ["Có những điều không thể diễn đạt bằng lời...", "Hãy suy ngẫm về điều đó."],
      energetic:  ["Ôi không! Mình bị lag rồi!! Nói lại nào!!!", "WHAT?! Nói to hơn đi!!!"],
      mysterious: ["...Có lẽ câu trả lời nằm ở nơi khác.", "Thời gian sẽ trả lời."],
    };
    const arr = fallbacks[this.config.personality];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  clearMemory() {
    this.memory = [];
  }

  getRecentTopics(): string[] {
    return this.memory
      .filter((m) => m.role === "user")
      .slice(-5)
      .map((m) => m.content.slice(0, 30));
  }
}

// ── Preset NPCs cho room ──────────────────────────────────────────────────────

export const ROOM_NPCS: NPCConfig[] = [
  {
    id: "sakura",
    name: "Sakura",
    personality: "friendly",
    backstory: "Sakura là cô gái anime sống trong thế giới ảo này. Cô yêu thích Naruto và Demon Slayer.",
    knownAnime: ["Naruto", "Demon Slayer", "My Hero Academia", "Sword Art Online"],
  },
  {
    id: "ryuu",
    name: "Ryuu",
    personality: "wise",
    backstory: "Ryuu là kiếm sĩ già đã xem hàng nghìn bộ anime. Ông biết mọi thứ về lịch sử anime.",
    knownAnime: ["Berserk", "Vinland Saga", "Attack on Titan", "Fullmetal Alchemist"],
  },
  {
    id: "yuki",
    name: "Yuki",
    personality: "tsundere",
    backstory: "Yuki là học sinh chuyển trường bí ẩn. Cô thích One Piece nhưng không bao giờ thừa nhận.",
    knownAnime: ["One Piece", "Bleach", "Hunter x Hunter", "JoJo's Bizarre Adventure"],
  },
];
