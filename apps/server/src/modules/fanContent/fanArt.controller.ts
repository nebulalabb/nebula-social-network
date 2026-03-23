import { Request, Response, NextFunction } from "express";
import prisma from "../../config/database";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = "1", limit = "20", tag, sort = "new" } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = tag ? { tags: { has: tag } } : {};
    const orderBy = sort === "hot" ? { viewCount: "desc" as const } : { createdAt: "desc" as const };
    const items = await prisma.fanArt.findMany({ where, orderBy, skip, take: parseInt(limit) });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.fanArt.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, error: { message: "Not found" } });
    await prisma.fanArt.update({ where: { id: item.id }, data: { viewCount: { increment: 1 } } });
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, images, tags, allowDownload } = req.body;
    const item = await prisma.fanArt.create({
      data: { authorId: req.user!.id, title, description, images: images ?? [], tags: tags ?? [], allowDownload: allowDownload ?? false },
    });
    res.status(201).json({ success: true, data: item });
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.fanArt.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, error: { message: "Not found" } });
    if (item.authorId !== req.user!.id && req.user!.role !== "ADMIN")
      return res.status(403).json({ success: false, error: { message: "Forbidden" } });
    await prisma.fanArt.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Deleted" });
  } catch (e) { next(e); }
}

export async function react(_req: Request, res: Response) {
  // Reactions stored in MongoDB posts collection — placeholder
  res.json({ success: true });
}
