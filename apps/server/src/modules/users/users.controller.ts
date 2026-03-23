import { Request, Response, NextFunction } from "express";
import { UsersService } from "./users.service";
import { prisma } from "../../config/database";

const usersService = new UsersService();

export class UsersController {
  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      if (!q) return res.json({ success: true, data: [] });
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q as string, mode: "insensitive" } },
            { profile: { displayName: { contains: q as string, mode: "insensitive" } } },
          ],
          deletedAt: null,
        },
        take: 10,
        select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
      });
      res.json({ success: true, data: users });
    } catch (e) { next(e); }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.findById((req as any).user.id);
      res.json({ status: "success", data: { user } });
    } catch (e) { next(e); }
  }

  async getByUsername(req: Request, res: Response, next: NextFunction) {
    try {
      const viewerId = (req as any).user?.id;
      const user = await usersService.findByUsername(req.params.username, viewerId);
      res.json({ status: "success", data: user });
    } catch (e) { next(e); }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const viewerId = (req as any).user?.id;
      const user = await usersService.findById(req.params.id, viewerId);
      res.json({ status: "success", data: user });
    } catch (e) { next(e); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await usersService.updateProfile((req as any).user.id, req.body);
      res.json({ status: "success", data: { profile } });
    } catch (e) { next(e); }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await usersService.updateStatus((req as any).user.id, req.body.status);
      res.json({ status: "success", data: { user } });
    } catch (e) { next(e); }
  }

  async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.blockUser((req as any).user.id, req.params.userId);
      res.json({ success: true });
    } catch (e) { next(e); }
  }

  async unblockUser(req: Request, res: Response, next: NextFunction) {
    try {
      await usersService.unblockUser((req as any).user.id, req.params.userId);
      res.json({ success: true });
    } catch (e) { next(e); }
  }

  async getBlockedUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await usersService.getBlockedUsers((req as any).user.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async claimDailyLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await usersService.claimDailyLogin((req as any).user.id);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  async getAnimePersonality(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id || (req as any).user?.id;
      const data = await usersService.getAnimePersonality(userId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getWrapped(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear() - 1;
      const data = await usersService.getWrapped((req as any).user.id, year);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getUserAnimeList(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await prisma.animeList.findMany({
        where: { userId: req.params.id },
        include: { anime: true },
        orderBy: { updatedAt: "desc" },
      });
      res.json({ status: "success", data: list });
    } catch (e) { next(e); }
  }

  async getUserMangaList(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await prisma.mangaList.findMany({
        where: { userId: req.params.id },
        include: { manga: true },
        orderBy: { updatedAt: "desc" },
      });
      res.json({ status: "success", data: list });
    } catch (e) { next(e); }
  }

  async getSpoilerSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await usersService.getSpoilerSettings((req as any).user.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async upsertSpoilerSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await usersService.upsertSpoilerSetting(
        (req as any).user.id,
        req.params.animeId,
        req.body.progress || 0
      );
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getAdminStats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (user.role !== "ADMIN") return res.status(403).json({ message: "Không có quyền" });
      const [totalUsers, totalAnime, totalManga, totalReviews, newUsersToday] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.animeEntry.count(),
        prisma.mangaEntry.count(),
        prisma.review.count(),
        prisma.user.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, deletedAt: null } }),
      ]);
      res.json({ success: true, data: { totalUsers, totalAnime, totalManga, totalReviews, newUsersToday } });
    } catch (e) { next(e); }
  }
}
