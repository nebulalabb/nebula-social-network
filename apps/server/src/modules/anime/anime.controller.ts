import { Request, Response, NextFunction } from "express";
import { AnimeService } from "./anime.service";

const animeService = new AnimeService();

export class AnimeController {
  async getList(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await animeService.getAnimeList(req.query as any);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, page } = req.query;
      const data = await animeService.searchAnime(q as string, Number(page) || 1);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await animeService.getAnimeById(Number(req.params.id));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getCharacters(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await animeService.getAnimeCharacters(Number(req.params.id));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getSeasonal(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, season } = req.query;
      const data = await animeService.getSeasonalAnime(Number(year) || undefined, season as string);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getTop(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, page } = req.query;
      const data = await animeService.getTopAnime(type as string, Number(page) || 1);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getMyList(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await animeService.getUserAnimeList(req.user!.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async upsertList(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await animeService.upsertAnimeList(req.user!.id, req.params.animeId, req.body);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async removeFromList(req: Request, res: Response, next: NextFunction) {
    try {
      await animeService.removeFromAnimeList(req.user!.id, req.params.animeId);
      res.json({ success: true });
    } catch (err) { next(err); }
  }
}
