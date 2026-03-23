import { prisma } from "../../config/database";

export type NotificationType =
  | "LIKE" | "COMMENT" | "REPLY" | "MENTION"
  | "FRIEND_REQUEST" | "FRIEND_ACCEPT" | "FOLLOW"
  | "ANIME_UPDATE" | "MANGA_UPDATE" | "SYSTEM";

export class NotificationService {
  async create(userId: string, type: NotificationType, actorId: string, entityType?: string, entityId?: string) {
    return prisma.notification.create({
      data: { userId, type, actorId, entityType, entityId },
    });
  }

  async getAll(userId: string, cursor?: string, limit = 20) {
    const where: any = { userId };
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });

    // Enrich with actor info
    const actorIds = [...new Set(notifications.map((n) => n.actorId).filter(Boolean))] as string[];
    const actors = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
    });
    const actorMap = Object.fromEntries(actors.map((a) => [a.id, a]));

    const enriched = notifications.map((n) => ({
      ...n,
      actor: n.actorId ? actorMap[n.actorId] : null,
    }));

    const nextCursor = notifications.length === limit
      ? notifications[notifications.length - 1].createdAt.toISOString()
      : null;

    return { notifications: enriched, nextCursor };
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({ where: { id: notificationId, userId } });
  }
}
