import { Request, Response, NextFunction } from "express";
import prisma from "../../config/database";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = "1", limit = "20", tag } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = tag ? { tags: { has: tag } } : {};
    const items = await prisma.cosplay.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.cosplay.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, error: { message: "Not found" } });
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, images, tags } = req.body;
    const item = await prisma.cosplay.create({
      data: { authorId: req.user!.id, title, description, images: images ?? [], tags: tags ?? [] },
    });
    res.status(201).json({ success: true, data: item });
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.cosplay.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, error: { message: "Not found" } });
    if (item.authorId !== req.user!.id && req.user!.role !== "ADMIN")
      return res.status(403).json({ success: false, error: { message: "Forbidden" } });
    await prisma.cosplay.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Deleted" });
  } catch (e) { next(e); }
}
