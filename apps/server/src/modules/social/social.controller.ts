import { Request, Response, NextFunction } from "express";
import { SocialService } from "./social.service";

const svc = new SocialService();

export class SocialController {
  async follow(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.follow(req.user!.id, req.params.userId);
      res.json({ success: true });
    } catch (e) { next(e); }
  }

  async unfollow(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.unfollow(req.user!.id, req.params.userId);
      res.json({ success: true });
    } catch (e) { next(e); }
  }

  async getFollowers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getFollowers(req.params.userId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getFollowing(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getFollowing(req.params.userId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async sendFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.sendFriendRequest(req.user!.id, req.params.userId);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async respondFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.respondFriendRequest(req.params.requestId, req.user!.id, req.body.accept);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async unfriend(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.unfriend(req.user!.id, req.params.userId);
      res.json({ success: true });
    } catch (e) { next(e); }
  }

  async getFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getFriends(req.user!.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getPendingRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getPendingRequests(req.user!.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getSuggestions(req.user!.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getAnimeMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getAnimeMatch(req.user!.id, req.params.userId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}
