import { Request, Response, NextFunction } from "express";
import { ReviewsService } from "./reviews.service";
import { GamificationService } from "../gamification/gamification.service";

const svc = new ReviewsService();
const gamification = new GamificationService();

export class ReviewsController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.createReview(req.user!.id, req.body);
      // Award EXP
      await gamification.addExp(req.user!.id, "REVIEW_WRITTEN").catch(() => {});
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getByEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;
      const { page, limit } = req.query;
      const data = await svc.getReviews(entityType.toUpperCase(), entityId, Number(page) || 1, Number(limit) || 10);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.updateReview(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.deleteReview(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  async getMyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getUserReviews(req.user!.id, Number(req.query.page) || 1);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async markHelpful(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.markHelpful(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}
