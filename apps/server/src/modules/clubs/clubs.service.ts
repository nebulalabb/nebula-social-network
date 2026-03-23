import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

export class ClubsService {
  async createClub(ownerId: string, data: {
    name: string; description?: string; category?: string; isPrivate?: boolean;
    avatarUrl?: string; bannerUrl?: string;
  }) {
    const slug = data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const club = await prisma.club.create({
      data: {
        ...data,
        slug,
        ownerId,
        members: { create: { userId: ownerId, role: "OWNER" } },
      },
      include: { owner: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } }, _count: { select: { members: true } } },
    });
    return club;
  }

  async getClubs(params: { category?: string; search?: string; page?: number; limit?: number }) {
    const { category, search, page = 1, limit = 20 } = params;
    const where: any = {};
    if (category && category !== "ALL") where.category = category;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [clubs, total] = await Promise.all([
      prisma.club.findMany({
        where,
        include: {
          owner: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.club.count({ where }),
    ]);
    return { clubs, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getClubById(id: string, userId?: string) {
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        members: {
          include: { user: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } } },
          orderBy: { joinedAt: "asc" },
          take: 20,
        },
        _count: { select: { members: true } },
      },
    });
    if (!club) throw new AppError(404, "Club không tồn tại");

    const isMember = userId ? club.members.some((m) => m.userId === userId) : false;
    return { ...club, isMember };
  }

  async joinClub(clubId: string, userId: string) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new AppError(404, "Club không tồn tại");

    const existing = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId, userId } } });
    if (existing) throw new AppError(400, "Bạn đã là thành viên của club này");

    return prisma.clubMember.create({ data: { clubId, userId, role: "MEMBER" } });
  }

  async leaveClub(clubId: string, userId: string) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new AppError(404, "Club không tồn tại");
    if (club.ownerId === userId) throw new AppError(400, "Chủ club không thể rời club");

    await prisma.clubMember.delete({ where: { clubId_userId: { clubId, userId } } });
  }

  async updateClub(clubId: string, userId: string, data: Partial<{ name: string; description: string; category: string; isPrivate: boolean; avatarUrl: string; bannerUrl: string }>) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new AppError(404, "Club không tồn tại");
    if (club.ownerId !== userId) throw new AppError(403, "Không có quyền chỉnh sửa club");
    return prisma.club.update({ where: { id: clubId }, data });
  }

  async deleteClub(clubId: string, userId: string) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) throw new AppError(404, "Club không tồn tại");
    if (club.ownerId !== userId) throw new AppError(403, "Không có quyền xóa club");
    await prisma.club.delete({ where: { id: clubId } });
  }

  async getUserClubs(userId: string) {
    return prisma.clubMember.findMany({
      where: { userId },
      include: {
        club: {
          include: {
            _count: { select: { members: true } },
            owner: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });
  }
}
