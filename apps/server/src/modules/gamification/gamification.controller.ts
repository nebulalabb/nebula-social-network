import { Request, Response, NextFunction } from "express";
import { GamificationService } from "./gamification.service";

const svc = new GamificationService();

export class GamificationController {
  async getMyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getUserStats(req.user!.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getUserStats(req.params.userId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, limit } = req.query;
      const data = await svc.getLeaderboard(
        (type as any) || "exp",
        limit ? +limit : 20
      );
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}
