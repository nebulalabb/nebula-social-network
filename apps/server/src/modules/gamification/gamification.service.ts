import { prisma } from "../../config/database";

// EXP thưởng cho từng hành động
const EXP_REWARDS: Record<string, number> = {
  POST_CREATED: 10,
  COMMENT_ADDED: 5,
  REVIEW_WRITTEN: 20,
  ANIME_COMPLETED: 15,
  MANGA_COMPLETED: 15,
  DAILY_LOGIN: 3,
  FRIEND_ADDED: 5,
};

// Level thresholds và danh hiệu
const LEVELS = [
  { level: 1, minExp: 0, title: "Genin Otaku" },
  { level: 2, minExp: 100, title: "Chunin Otaku" },
  { level: 3, minExp: 300, title: "Jonin Otaku" },
  { level: 4, minExp: 700, title: "ANBU Otaku" },
  { level: 5, minExp: 1500, title: "Kage Otaku" },
  { level: 6, minExp: 3000, title: "Hokage Otaku" },
  { level: 7, minExp: 6000, title: "Legendary Otaku" },
  { level: 8, minExp: 12000, title: "Anime God" },
];

export function getLevelInfo(totalExp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalExp >= LEVELS[i].minExp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null!;
      break;
    }
  }
  const progress = next
    ? Math.round(((totalExp - current.minExp) / (next.minExp - current.minExp)) * 100)
    : 100;
  return { ...current, totalExp, nextLevel: next, progress };
}

export class GamificationService {
  async addExp(userId: string, action: string) {
    const amount = EXP_REWARDS[action] || 0;
    if (!amount) return;

    await prisma.eXPLog.create({ data: { userId, action, amount } });

    // Tính tổng EXP
    const total = await prisma.eXPLog.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    const totalExp = total._sum.amount || 0;
    const levelInfo = getLevelInfo(totalExp);

    // Cập nhật level vào profile (dùng socialLinks JSON tạm thời)
    // TODO: thêm field level vào schema
    return { totalExp, levelInfo };
  }

  async getUserStats(userId: string) {
    const [totalExp, animeCompleted, mangaCompleted, postsCount, reviewsCount] = await Promise.all([
      prisma.eXPLog.aggregate({ where: { userId }, _sum: { amount: true } }),
      prisma.animeList.count({ where: { userId, status: "COMPLETED" } }),
      prisma.mangaList.count({ where: { userId, status: "COMPLETED" } }),
      // Posts count từ MongoDB - trả về 0 tạm thời
      Promise.resolve(0),
      prisma.review.count({ where: { userId } }),
    ]);

    const exp = totalExp._sum.amount || 0;
    return {
      totalExp: exp,
      level: getLevelInfo(exp),
      animeCompleted,
      mangaCompleted,
      postsCount,
      reviewsCount,
    };
  }

  async getLeaderboard(type: "exp" | "anime" | "manga" = "exp", limit = 20) {
    if (type === "exp") {
      const rows = await prisma.eXPLog.groupBy({
        by: ["userId"],
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: limit,
      });

      const userIds = rows.map((r) => r.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
      });
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

      return rows.map((r, i) => ({
        rank: i + 1,
        user: userMap[r.userId],
        totalExp: r._sum.amount || 0,
        level: getLevelInfo(r._sum.amount || 0),
      }));
    }

    if (type === "anime") {
      const rows = await prisma.animeList.groupBy({
        by: ["userId"],
        where: { status: "COMPLETED" },
        _count: { animeId: true },
        orderBy: { _count: { animeId: "desc" } },
        take: limit,
      });
      const userIds = rows.map((r) => r.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
      });
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      return rows.map((r, i) => ({ rank: i + 1, user: userMap[r.userId], count: r._count.animeId }));
    }

    return [];
  }

  async checkAndAwardBadges(userId: string) {
    const stats = await this.getUserStats(userId);
    const badges: string[] = [];

    const BADGE_CRITERIA = [
      { name: "Anime Starter", condition: stats.animeCompleted >= 10 },
      { name: "Anime Enthusiast", condition: stats.animeCompleted >= 50 },
      { name: "Anime Master", condition: stats.animeCompleted >= 100 },
      { name: "Manga Reader", condition: stats.mangaCompleted >= 10 },
      { name: "Reviewer", condition: stats.reviewsCount >= 10 },
    ];

    for (const { name, condition } of BADGE_CRITERIA) {
      if (!condition) continue;
      const badge = await prisma.badge.findUnique({ where: { name } });
      if (!badge) continue;
      const existing = await prisma.userBadge.findFirst({ where: { userId, badgeId: badge.id } });
      if (!existing) {
        await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
        badges.push(name);
      }
    }

    return badges;
  }
}
