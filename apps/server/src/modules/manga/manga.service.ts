import axios from "axios";
import { prisma } from "../../config/database";
import { redis } from "../../config/redis";
import { GamificationService } from "../gamification/gamification.service";

const gamification = new GamificationService();

const JIKAN_BASE = "https://api.jikan.moe/v4";
const CACHE_TTL = 60 * 60 * 24;

export class MangaService {
  private async cachedGet(key: string, fetcher: () => Promise<any>) {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    const data = await fetcher();
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
    return data;
  }

  async searchManga(q: string, page = 1, limit = 20) {
    return this.cachedGet(`manga:search:${q}:${page}`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/manga`, { params: { q, page, limit, sfw: true } });
      return { items: data.data, pagination: data.pagination };
    });
  }

  async getMangaList(params: { genre?: string; type?: string; status?: string; page?: number; limit?: number }) {
    const { page = 1, limit = 20, ...filters } = params;
    return this.cachedGet(`manga:list:${JSON.stringify(filters)}:${page}`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/manga`, { params: { ...filters, page, limit, sfw: true } });
      return { items: data.data, pagination: data.pagination };
    });
  }

  async getMangaById(id: number) {
    return this.cachedGet(`manga:${id}`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/manga/${id}/full`);
      return data.data;
    });
  }

  async getTopManga(page = 1) {
    return this.cachedGet(`manga:top:${page}`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/top/manga`, { params: { page } });
      return { items: data.data, pagination: data.pagination };
    });
  }

  async getMangaCharacters(id: number) {
    return this.cachedGet(`manga:${id}:characters`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/manga/${id}/characters`);
      return data.data;
    });
  }

  async getUserMangaList(userId: string) {
    return prisma.mangaList.findMany({
      where: { userId },
      include: { manga: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async upsertMangaList(userId: string, mangaId: string, data: { status?: string; progress?: number; score?: number; notes?: string }) {
    const prev = await prisma.mangaList.findUnique({ where: { userId_mangaId: { userId, mangaId } } });
    const result = await prisma.mangaList.upsert({
      where: { userId_mangaId: { userId, mangaId } },
      create: { userId, mangaId, ...data as any },
      update: data as any,
    });
    // Award EXP khi hoàn thành manga
    if (data.status === "COMPLETED" && prev?.status !== "COMPLETED") {
      await gamification.addExp(userId, "MANGA_COMPLETED");
    }
    return result;
  }

  async removeFromMangaList(userId: string, mangaId: string) {
    return prisma.mangaList.delete({ where: { userId_mangaId: { userId, mangaId } } });
  }
}
