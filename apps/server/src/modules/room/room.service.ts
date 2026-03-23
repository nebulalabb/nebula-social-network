import { prisma } from "../../config/database";

export const roomService = {
  // Lấy hoặc tạo phòng cá nhân của user
  async getOrCreatePersonalRoom(userId: string) {
    let room = await prisma.room.findFirst({ where: { ownerId: userId, worldId: null }, include: { decors: { include: { asset: true } } } });
    if (!room) {
      room = await prisma.room.create({
        data: { ownerId: userId, name: "Phòng của tôi", isPublic: false },
        include: { decors: { include: { asset: true } } },
      });
    }
    return room;
  },

  async getRoomById(roomId: string) {
    return prisma.room.findUnique({
      where: { id: roomId },
      include: { decors: { include: { asset: true } }, owner: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } } },
    });
  },

  async updateRoom(roomId: string, userId: string, data: { name?: string; isPublic?: boolean; theme?: string; musicUrl?: string }) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.ownerId !== userId) throw new Error("Không có quyền");
    return prisma.room.update({ where: { id: roomId }, data });
  },

  async saveDecors(roomId: string, userId: string, objects: any[]) {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.ownerId !== userId) throw new Error("Không có quyền");
    await prisma.roomDecor.deleteMany({ where: { roomId } });
    if (objects.length > 0) {
      await prisma.roomDecor.createMany({
        data: objects.map((o) => ({
          roomId,
          assetId: o.assetId || null,
          type: o.type || "object",
          assetUrl: o.assetUrl || null,
          posX: o.posX ?? o.position?.x ?? 0,
          posY: o.posY ?? o.position?.y ?? 0,
          posZ: o.posZ ?? o.position?.z ?? 0,
          rotY: o.rotY ?? o.rotation?.y ?? 0,
          scale: o.scale ?? 1,
        })),
      });
    }
    return prisma.room.findUnique({ where: { id: roomId }, include: { decors: true } });
  },

  async getPublicRooms(page = 1, limit = 20, sort?: string) {
    const skip = (page - 1) * limit;
    const orderBy = sort === "active"
      ? [{ updatedAt: "desc" as const }]
      : [{ updatedAt: "desc" as const }];
    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where: { isPublic: true },
        skip,
        take: limit,
        orderBy,
        include: { owner: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } }, _count: { select: { decors: true } } },
      }),
      prisma.room.count({ where: { isPublic: true } }),
    ]);
    return { rooms, total, page, limit };
  },

  async getAssets(category?: string) {
    return prisma.asset.findMany({
      where: { isPublic: true, ...(category ? { category } : {}) },
      orderBy: { name: "asc" },
    });
  },
};
