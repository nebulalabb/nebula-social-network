import { Request, Response, NextFunction } from "express";
import prisma from "../../config/database";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = "1", limit = "20", status, tag } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (status) where.status = status;
    if (tag) where.tags = { has: tag };
    const items = await prisma.fanFic.findMany({
      where, skip, take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: { chapters: { select: { id: true }, orderBy: { order: "asc" } } },
    });
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.fanFic.findUnique({
      where: { id: req.params.id },
      include: { chapters: { select: { id: true, title: true, order: true, wordCount: true, createdAt: true }, orderBy: { order: "asc" } } },
    });
    if (!item) return res.status(404).json({ success: false, error: { message: "Not found" } });
    await prisma.fanFic.update({ where: { id: item.id }, data: { viewCount: { increment: 1 } } });
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, summary, tags, warnings, language, status } = req.body;
    const item = await prisma.fanFic.create({
      data: { authorId: req.user!.id, title, summary, tags: tags ?? [], warnings: warnings ?? [], language: language ?? "vi", status: status ?? "ONGOING" },
    });
    res.status(201).json({ success: true, data: item });
  } catch (e) { next(e); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await prisma.fanFic.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, error: { message: "Not found" } });
    if (item.authorId !== req.user!.id && req.user!.role !== "ADMIN")
      return res.status(403).json({ success: false, error: { message: "Forbidden" } });
    await prisma.fanFic.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: "Deleted" });
  } catch (e) { next(e); }
}

export async function addChapter(req: Request, res: Response, next: NextFunction) {
  try {
    const fic = await prisma.fanFic.findUnique({ where: { id: req.params.id } });
    if (!fic) return res.status(404).json({ success: false, error: { message: "Not found" } });
    if (fic.authorId !== req.user!.id) return res.status(403).json({ success: false, error: { message: "Forbidden" } });
    const count = await prisma.fanFicChapter.count({ where: { fanFicId: fic.id } });
    const { title, content } = req.body;
    const chapter = await prisma.fanFicChapter.create({
      data: { fanFicId: fic.id, title, content, order: count + 1, wordCount: content?.split(/\s+/).length ?? 0 },
    });
    res.status(201).json({ success: true, data: chapter });
  } catch (e) { next(e); }
}

export async function getChapter(req: Request, res: Response, next: NextFunction) {
  try {
    const chapter = await prisma.fanFicChapter.findUnique({ where: { id: req.params.chapterId } });
    if (!chapter) return res.status(404).json({ success: false, error: { message: "Not found" } });
    res.json({ success: true, data: chapter });
  } catch (e) { next(e); }
}

export async function updateChapter(req: Request, res: Response, next: NextFunction) {
  try {
    const fic = await prisma.fanFic.findUnique({ where: { id: req.params.id } });
    if (!fic || fic.authorId !== req.user!.id) return res.status(403).json({ success: false, error: { message: "Forbidden" } });
    const { title, content } = req.body;
    const chapter = await prisma.fanFicChapter.update({
      where: { id: req.params.chapterId },
      data: { title, content, wordCount: content?.split(/\s+/).length ?? 0 },
    });
    res.json({ success: true, data: chapter });
  } catch (e) { next(e); }
}
