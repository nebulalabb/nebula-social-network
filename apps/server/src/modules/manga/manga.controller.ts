import { Request, Response, NextFunction } from "express";
import { MangaService } from "./manga.service";

const svc = new MangaService();

export class MangaController {
  async getList(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await svc.getMangaList(req.query as any) }); } catch (e) { next(e); }
  }
  async search(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await svc.searchManga(req.query.q as string, Number(req.query.page) || 1) }); } catch (e) { next(e); }
  }
  async getById(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await svc.getMangaById(Number(req.params.id)) }); } catch (e) { next(e); }
  }
  async getCharacters(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await svc.getMangaCharacters(Number(req.params.id)) }); } catch (e) { next(e); }
  }
  async getTop(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await svc.getTopManga(Number(req.query.page) || 1) }); } catch (e) { next(e); }
  }
  async getMyList(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await svc.getUserMangaList(req.user!.id) }); } catch (e) { next(e); }
  }
  async upsertList(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await svc.upsertMangaList(req.user!.id, req.params.mangaId, req.body) }); } catch (e) { next(e); }
  }
  async removeFromList(req: Request, res: Response, next: NextFunction) {
    try { await svc.removeFromMangaList(req.user!.id, req.params.mangaId); res.json({ success: true }); } catch (e) { next(e); }
  }
}
