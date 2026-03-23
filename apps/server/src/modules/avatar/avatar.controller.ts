import { Request, Response } from "express";
import { avatarService } from "./avatar.service";

export const avatarController = {
  async getMyAvatar(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const avatar = await avatarService.getAvatar(userId);
      res.json({ status: "success", data: avatar });
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  },

  async getAvatarByUser(req: Request, res: Response) {
    try {
      const avatar = await avatarService.getAvatar(req.params.userId);
      res.json({ status: "success", data: avatar });
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  },

  async upsertAvatar(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const avatar = await avatarService.upsertAvatar(userId, req.body);
      res.json({ status: "success", data: avatar });
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  },

  async uploadVRM(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      if (!req.file) {
        return res.status(400).json({ status: "error", message: "Không có file VRM" });
      }
      if (!req.file.originalname.endsWith(".vrm")) {
        return res.status(400).json({ status: "error", message: "Chỉ chấp nhận file .vrm" });
      }
      const result = await avatarService.uploadVRM(userId, req.file.buffer, req.file.originalname);
      res.json({ status: "success", data: result });
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  },
};
