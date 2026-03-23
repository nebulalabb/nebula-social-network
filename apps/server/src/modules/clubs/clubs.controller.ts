import { Request, Response, NextFunction } from "express";
import { ClubsService } from "./clubs.service";

const svc = new ClubsService();

export class ClubsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.createClub(req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getClubs(req.query as any);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getClubById(req.params.id, req.user?.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async join(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.joinClub(req.params.id, req.user!.id);
      res.json({ success: true, message: "Đã tham gia club" });
    } catch (err) { next(err); }
  }

  async leave(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.leaveClub(req.params.id, req.user!.id);
      res.json({ success: true, message: "Đã rời club" });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.updateClub(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.deleteClub(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  async getMyClubs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getUserClubs(req.user!.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}
