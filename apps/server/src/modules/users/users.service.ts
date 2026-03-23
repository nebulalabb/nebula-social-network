import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

const USER_SELECT = {
  id: true, email: true, username: true, role: true,
  status: true, emailVerified: true, twoFactorEnabled: true,
  createdAt: true,
  profile: true,
};

export class UsersService {
  async findById(id: string, viewerId?: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        _count: {
          select: {
            follows: true,
            followers: true,
            friendships: { where: { status: "ACCEPTED" } },
          },
        },
      },
    });
    if (!user) throw new AppError(404, "Người dùng không tồn tại");

    let isFollowing = false;
    let isFriend = false;
    let friendRequestSent = false;
    let isBlocked = false;

    if (viewerId && viewerId !== id) {
      const [follow, friendship, block] = await Promise.all([
        prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: id } } }),
        prisma.friendship.findFirst({
          where: { OR: [{ senderId: viewerId, receiverId: id }, { senderId: id, receiverId: viewerId }] },
        }),
        prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: viewerId, blockedId: id } } }),
      ]);
      isFollowing = !!follow;
      isFriend = friendship?.status === "ACCEPTED";
      friendRequestSent = friendship?.status === "PENDING" && friendship?.senderId === viewerId;
      isBlocked = !!block;
    }

    return { ...user, isFollowing, isFriend, friendRequestSent, isBlocked };
  }

  async findByUsername(username: string, viewerId?: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        ...USER_SELECT,
        _count: {
          select: {
            follows: true,
            followers: true,
            friendships: { where: { status: "ACCEPTED" } },
          },
        },
      },
    });
    if (!user) throw new AppError(404, "Người dùng không tồn tại");

    let isFollowing = false;
    let isFriend = false;
    let friendRequestSent = false;
    let isBlocked = false;

    if (viewerId && viewerId !== user.id) {
      const [follow, friendship, block] = await Promise.all([
        prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewerId, followingId: user.id } } }),
        prisma.friendship.findFirst({
          where: { OR: [{ senderId: viewerId, receiverId: user.id }, { senderId: user.id, receiverId: viewerId }] },
        }),
        prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: viewerId, blockedId: user.id } } }),
      ]);
      isFollowing = !!follow;
      isFriend = friendship?.status === "ACCEPTED";
      friendRequestSent = friendship?.status === "PENDING" && friendship?.senderId === viewerId;
      isBlocked = !!block;
    }

    return { ...user, isFollowing, isFriend, friendRequestSent, isBlocked };
  }

  async updateProfile(userId: string, data: {
    displayName?: string; bio?: string; gender?: string;
    birthday?: string; location?: string; website?: string; socialLinks?: any;
    visibility?: any; showAnimeList?: boolean; showMangaList?: boolean; showAge?: boolean;
    avatarUrl?: string; bannerUrl?: string;
    topAnimeIds?: string[]; topMangaIds?: string[]; favCharacterIds?: string[];
  }) {
    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        displayName: data.displayName,
        bio: data.bio,
        gender: data.gender,
        birthday: data.birthday ? new Date(data.birthday) : undefined,
        location: data.location,
        website: data.website,
        socialLinks: data.socialLinks,
        visibility: data.visibility,
        showAnimeList: data.showAnimeList,
        showMangaList: data.showMangaList,
        showAge: data.showAge,
        avatarUrl: data.avatarUrl,
        bannerUrl: data.bannerUrl,
        topAnimeIds: data.topAnimeIds,
        topMangaIds: data.topMangaIds,
        favCharacterIds: data.favCharacterIds,
      },
    });
    return profile;
  }

  async updateStatus(userId: string, status: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
      select: USER_SELECT,
    });
  }

  // ─── Block ────────────────────────────────────────────────────────────────
  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new AppError(400, "Không thể tự chặn bản thân");
    // Xóa follow/friend nếu có
    await Promise.all([
      prisma.follow.deleteMany({ where: { OR: [{ followerId: blockerId, followingId: blockedId }, { followerId: blockedId, followingId: blockerId }] } }),
      prisma.friendship.deleteMany({ where: { OR: [{ senderId: blockerId, receiverId: blockedId }, { senderId: blockedId, receiverId: blockerId }] } }),
    ]);
    return prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await prisma.block.deleteMany({ where: { blockerId, blockedId } });
  }

  async getBlockedUsers(userId: string) {
    const rows = await prisma.block.findMany({
      where: { blockerId: userId },
      include: { blocked: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } } },
    });
    return rows.map((r: any) => r.blocked);
  }

  // ─── Daily Login EXP ─────────────────────────────────────────────────────
  async claimDailyLogin(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.dailyLogin.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing) return { alreadyClaimed: true };

    await prisma.dailyLogin.create({ data: { userId, date: today } });
    await prisma.eXPLog.create({ data: { userId, action: "DAILY_LOGIN", amount: 3 } });
    return { alreadyClaimed: false, expAwarded: 3 };
  }

  // ─── Anime Personality ───────────────────────────────────────────────────
  async getAnimePersonality(userId: string) {
    const animeList = await prisma.animeList.findMany({
      where: { userId, status: "COMPLETED" },
      include: { anime: { select: { genres: true } } },
    });

    const genreCount: Record<string, number> = {};
    for (const item of animeList) {
      for (const genre of item.anime?.genres || []) {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      }
    }

    const sorted = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
    const topGenres = sorted.slice(0, 5).map(([g]) => g);

    const PERSONALITY_MAP: Record<string, { type: string; desc: string; emoji: string; traits: string[] }> = {
      Action: { type: "Chiến binh", desc: "Bạn thích hành động và thử thách", emoji: "⚔️", traits: ["Dũng cảm", "Quyết đoán", "Thích cạnh tranh"] },
      Romance: { type: "Lãng mạn", desc: "Bạn là người đa cảm và yêu thương", emoji: "💕", traits: ["Đa cảm", "Chân thành", "Trân trọng tình cảm"] },
      Comedy: { type: "Hài hước", desc: "Bạn luôn tìm kiếm niềm vui trong cuộc sống", emoji: "😄", traits: ["Vui vẻ", "Lạc quan", "Thích cười"] },
      Fantasy: { type: "Mơ mộng", desc: "Bạn có trí tưởng tượng phong phú", emoji: "🌟", traits: ["Sáng tạo", "Mơ mộng", "Thích phiêu lưu"] },
      "Sci-Fi": { type: "Nhà khoa học", desc: "Bạn tò mò về tương lai và công nghệ", emoji: "🔬", traits: ["Tò mò", "Phân tích", "Hướng tương lai"] },
      Horror: { type: "Dũng cảm", desc: "Bạn không sợ đối mặt với bóng tối", emoji: "🎃", traits: ["Gan dạ", "Thích cảm giác mạnh", "Không sợ hãi"] },
      Mystery: { type: "Thám tử", desc: "Bạn thích giải đố và khám phá bí ẩn", emoji: "🔍", traits: ["Nhạy bén", "Kiên nhẫn", "Thích suy luận"] },
      Drama: { type: "Cảm xúc sâu sắc", desc: "Bạn trân trọng những câu chuyện có chiều sâu", emoji: "🎭", traits: ["Nhạy cảm", "Sâu sắc", "Đồng cảm"] },
      "Slice of Life": { type: "Bình yên", desc: "Bạn tìm thấy vẻ đẹp trong cuộc sống thường ngày", emoji: "🌸", traits: ["Điềm tĩnh", "Trân trọng hiện tại", "Yêu cuộc sống"] },
      Sports: { type: "Nhiệt huyết", desc: "Bạn đam mê cạnh tranh và tinh thần đồng đội", emoji: "🏆", traits: ["Nhiệt huyết", "Kiên trì", "Tinh thần đồng đội"] },
    };

    const personality = topGenres.length > 0
      ? (PERSONALITY_MAP[topGenres[0]] || { type: "Đa dạng", desc: "Bạn thích nhiều thể loại khác nhau", emoji: "🎨", traits: ["Linh hoạt", "Cởi mở", "Đa dạng"] })
      : null;

    return {
      type: personality?.type,
      description: personality?.desc,
      emoji: personality?.emoji,
      traits: personality?.traits || [],
      topGenres,
      genreCount,
      totalCompleted: animeList.length,
    };
  }

  // ─── Wrapped (Yearly Stats) ───────────────────────────────────────────────
  async getWrapped(userId: string, year: number) {
    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year + 1}-01-01`);

    const [animeCompleted, mangaCompleted, expLogs, reviews] = await Promise.all([
      prisma.animeList.findMany({
        where: { userId, status: "COMPLETED", finishDateTime: { gte: start, lt: end } },
        include: { anime: { select: { titleEn: true, genres: true, episodes: true, images: true } } },
      }),
      prisma.mangaList.findMany({
        where: { userId, status: "COMPLETED", finishDateTime: { gte: start, lt: end } },
        include: { manga: { select: { titleEn: true, genres: true, chapters: true, images: true } } },
      }),
      prisma.eXPLog.findMany({ where: { userId, createdAt: { gte: start, lt: end } } }),
      prisma.review.findMany({ where: { userId, createdAt: { gte: start, lt: end } } }),
    ]);

    const totalExp = expLogs.reduce((s, l) => s + l.amount, 0);
    const genreCount: Record<string, number> = {};
    for (const item of animeCompleted) {
      for (const g of item.anime?.genres || []) genreCount[g] = (genreCount[g] || 0) + 1;
    }
    const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return {
      year,
      animeCompleted: animeCompleted.length,
      mangaCompleted: mangaCompleted.length,
      totalEpisodes: animeCompleted.reduce((s, a) => s + (a.anime?.episodes || 0), 0),
      totalChapters: mangaCompleted.reduce((s, m) => s + (m.manga?.chapters || 0), 0),
      totalExp,
      reviewsWritten: reviews.length,
      topGenre,
      genreBreakdown: genreCount,
      topAnime: animeCompleted.slice(0, 5).map((a) => ({ title: a.anime?.titleEn, image: (a.anime?.images as any)?.jpg?.image_url })),
    };
  }

  // ─── Spoiler Settings ────────────────────────────────────────────────────
  async getSpoilerSettings(userId: string) {
    return prisma.spoilerSetting.findMany({ where: { userId } });
  }

  async upsertSpoilerSetting(userId: string, animeId: string, progress: number) {
    return prisma.spoilerSetting.upsert({
      where: { userId_animeId: { userId, animeId } },
      create: { userId, animeId, progress },
      update: { progress },
    });
  }
}