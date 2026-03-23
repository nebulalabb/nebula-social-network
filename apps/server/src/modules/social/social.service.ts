import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

export class SocialService {
  // ─── Follow ───────────────────────────────────────────────────────────────
  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new AppError(400, "Không thể tự follow bản thân");
    return prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
  }

  async unfollow(followerId: string, followingId: string) {
    await prisma.follow.deleteMany({ where: { followerId, followingId } });
  }

  async getFollowers(userId: string) {
    const rows = await prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } } },
    });
    return rows.map((r) => r.follower);
  }

  async getFollowing(userId: string) {
    const rows = await prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } } },
    });
    return rows.map((r) => r.following);
  }

  // ─── Friend ───────────────────────────────────────────────────────────────
  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) throw new AppError(400, "Không thể kết bạn với bản thân");
    const existing = await prisma.friendship.findFirst({
      where: { OR: [{ senderId, receiverId }, { senderId: receiverId, receiverId: senderId }] },
    });
    if (existing) throw new AppError(400, "Đã tồn tại quan hệ kết bạn");
    return prisma.friendship.create({ data: { senderId, receiverId, status: "PENDING" } });
  }

  async respondFriendRequest(requestId: string, userId: string, accept: boolean) {
    const req = await prisma.friendship.findUnique({ where: { id: requestId } });
    if (!req) throw new AppError(404, "Không tìm thấy lời mời");
    if (req.receiverId !== userId) throw new AppError(403, "Không có quyền");
    if (accept) {
      return prisma.friendship.update({ where: { id: requestId }, data: { status: "ACCEPTED" } });
    } else {
      await prisma.friendship.delete({ where: { id: requestId } });
      return { status: "DECLINED" };
    }
  }

  async unfriend(userId: string, friendId: string) {
    await prisma.friendship.deleteMany({
      where: { OR: [{ senderId: userId, receiverId: friendId }, { senderId: friendId, receiverId: userId }] },
    });
  }

  async getFriends(userId: string) {
    const rows = await prisma.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ senderId: userId }, { receiverId: userId }] },
      include: {
        sender: { select: { id: true, username: true, status: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        receiver: { select: { id: true, username: true, status: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });
    return rows.map((r) => (r.senderId === userId ? r.receiver : r.sender));
  }

  async getPendingRequests(userId: string) {
    return prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: { sender: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } } },
    });
  }

  async getSuggestions(userId: string) {
    // Gợi ý dựa trên anime list trùng nhau
    const myList = await prisma.animeList.findMany({ where: { userId }, select: { animeId: true } });
    const myAnimeIds = myList.map((a) => a.animeId);

    const friends = await this.getFriends(userId);
    const friendIds = friends.map((f: any) => f.id);

    if (myAnimeIds.length === 0) {
      // Fallback: random users
      const users = await prisma.user.findMany({
        where: { id: { notIn: [userId, ...friendIds] }, deletedAt: null },
        take: 10,
        select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
      });
      return users;
    }

    const similar = await prisma.animeList.groupBy({
      by: ["userId"],
      where: { animeId: { in: myAnimeIds }, userId: { notIn: [userId, ...friendIds] } },
      _count: { animeId: true },
      orderBy: { _count: { animeId: "desc" } },
      take: 10,
    });

    const userIds = similar.map((s) => s.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, deletedAt: null },
      select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
    });

    return users.map((u) => ({
      ...u,
      commonAnime: similar.find((s) => s.userId === u.id)?._count.animeId || 0,
    }));
  }

  async getAnimeMatch(userId: string, targetId: string) {
    const [myList, theirList] = await Promise.all([
      prisma.animeList.findMany({ where: { userId }, select: { animeId: true } }),
      prisma.animeList.findMany({ where: { userId: targetId }, select: { animeId: true } }),
    ]);
    const mySet = new Set(myList.map((a) => a.animeId));
    const theirSet = new Set(theirList.map((a) => a.animeId));
    const intersection = [...mySet].filter((id) => theirSet.has(id));
    const union = new Set([...mySet, ...theirSet]);
    const similarity = union.size > 0 ? Math.round((intersection.length / union.size) * 100) : 0;
    return { similarity, commonCount: intersection.length, commonAnimeIds: intersection };
  }
}
