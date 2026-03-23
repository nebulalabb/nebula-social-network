import { Request, Response } from "express";
import { roomService } from "./room.service";

export const roomController = {
  async getMyRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const room = await roomService.getOrCreatePersonalRoom(userId);
      res.json({ status: "success", data: room });
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  },

  async getRoom(req: Request, res: Response) {
    try {
      const room = await roomService.getRoomById(req.params.id);
      if (!room) return res.status(404).json({ status: "error", message: "Không tìm thấy phòng" });
      res.json({ status: "success", data: room });
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  },

  async updateRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const room = await roomService.updateRoom(req.params.id, userId, req.body);
      res.json({ status: "success", data: room });
    } catch (e: any) {
      res.status(403).json({ status: "error", message: e.message });
    }
  },

  async saveDecors(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { objects } = req.body;
      const room = await roomService.saveDecors(req.params.id, userId, objects || []);
      res.json({ status: "success", data: room });
    } catch (e: any) {
      res.status(403).json({ status: "error", message: e.message });
    }
  },

  async getPublicRooms(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sort = req.query.sort as string | undefined;
      const data = await roomService.getPublicRooms(page, limit, sort);
      res.json({ status: "success", data });
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  },

  async getAssets(req: Request, res: Response) {
    try {
      const category = req.query.category as string | undefined;
      const assets = await roomService.getAssets(category);
      res.json({ status: "success", data: assets });
    } catch (e: any) {
      res.status(500).json({ status: "error", message: e.message });
    }
  },
};
