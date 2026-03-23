import { Request, Response, NextFunction } from "express";
import { ChatService } from "./chat.service";
import { io } from "../../socket";

const svc = new ChatService();

export class ChatController {
  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getUserConversations(req.user!.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getOrCreateDirect(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.getOrCreateDirect(req.user!.id, req.params.userId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async createGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, memberIds } = req.body;
      const data = await svc.createGroup(req.user!.id, name, memberIds);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { cursor, limit } = req.query;
      const data = await svc.getMessages(req.params.id, req.user!.id, cursor as string, limit ? +limit : 30);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const msg = await svc.sendMessage(req.params.id, req.user!.id, req.body);
      // Emit via socket
      io?.to(`conv:${req.params.id}`).emit("chat:receive", msg);
      res.status(201).json({ success: true, data: msg });
    } catch (e) { next(e); }
  }

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const msg = await svc.deleteMessage(req.params.msgId, req.user!.id);
      io?.to(`conv:${req.params.id}`).emit("chat:delete", { messageId: req.params.msgId });
      res.json({ success: true, data: msg });
    } catch (e) { next(e); }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.markRead(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (e) { next(e); }
  }

  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await svc.addMember(req.params.id, req.user!.id, req.body.userId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async leaveConversation(req: Request, res: Response, next: NextFunction) {
    try {
      await svc.leaveConversation(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (e) { next(e); }
  }
}
