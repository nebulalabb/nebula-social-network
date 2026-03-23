import { Request, Response, NextFunction } from "express";
import { NotificationService } from "./notification.service";

const svc = new NotificationService();

export class NotificationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { cursor, limit } = req.query;
      const data = await svc.getAll(req.user!.id, cursor as string, limit ? +limit : 20);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await svc.getUnreadCount(req.user!.id);
      res.json({ success: true, data: { count } });
    } catch (e) { next(e); }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.markRead(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (e) { next(e); }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.markAllRead(req.user!.id);
      res.json({ success: true });
    } catch (e) { next(e); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.delete(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (e) { next(e); }
  }
}
