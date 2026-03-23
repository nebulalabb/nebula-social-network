import axios from "axios";
import { prisma } from "../../config/database";
import { redis } from "../../config/redis";
import { GamificationService } from "../gamification/gamification.service";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const CACHE_TTL = 60 * 60 * 24; // 24 giờ
const gamification = new GamificationService();

export class AnimeService {
  private async cachedGet(key: string, fetcher: () => Promise<any>) {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    const data = await fetcher();
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
    return data;
  }

  async searchAnime(q: string, page = 1, limit = 20) {
    return this.cachedGet(`anime:search:${q}:${page}`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/anime`, {
        params: { q, page, limit, sfw: true },
      });
      return { items: data.data, pagination: data.pagination };
    });
  }

  async getAnimeList(params: {
    genre?: string; type?: string; status?: string;
    year?: number; season?: string; sort?: string;
    page?: number; limit?: number;
  }) {
    const { page = 1, limit = 20, ...filters } = params;
    const cacheKey = `anime:list:${JSON.stringify(filters)}:${page}`;
    return this.cachedGet(cacheKey, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/anime`, {
        params: { ...filters, page, limit, sfw: true },
      });
      return { items: data.data, pagination: data.pagination };
    });
  }

  async getAnimeById(id: number) {
    return this.cachedGet(`anime:${id}`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/anime/${id}/full`);
      return data.data;
    });
  }

  async getSeasonalAnime(year?: number, season?: string) {
    const y = year || new Date().getFullYear();
    const seasons = ["winter", "spring", "summer", "fall"];
    const month = new Date().getMonth();
    const s = season || seasons[Math.floor(month / 3)];
    return this.cachedGet(`anime:seasonal:${y}:${s}`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/seasons/${y}/${s}`);
      return { items: data.data, year: y, season: s };
    });
  }

  async getTopAnime(type = "tv", page = 1) {
    return this.cachedGet(`anime:top:${type}:${page}`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/top/anime`, {
        params: { type, page },
      });
      return { items: data.data, pagination: data.pagination };
    });
  }

  async getAnimeCharacters(id: number) {
    return this.cachedGet(`anime:${id}:characters`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/anime/${id}/characters`);
      return data.data;
    });
  }

  // Tracking
  async getUserAnimeList(userId: string) {
    return prisma.animeList.findMany({
      where: { userId },
      include: { anime: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  async upsertAnimeList(userId: string, animeId: string, data: {
    status?: string; progress?: number; score?: number; notes?: string;
  }) {
    const prev = await prisma.animeList.findUnique({ where: { userId_animeId: { userId, animeId } } });
    const result = await prisma.animeList.upsert({
      where: { userId_animeId: { userId, animeId } },
      create: { userId, animeId, ...data as any },
      update: data as any,
    });
    // Award EXP khi hoàn thành
    if (data.status === "COMPLETED" && prev?.status !== "COMPLETED") {
      await gamification.addExp(userId, "ANIME_COMPLETED").catch(() => {});
    }
    return result;
  }

  async removeFromAnimeList(userId: string, animeId: string) {
    return prisma.animeList.delete({
      where: { userId_animeId: { userId, animeId } },
    });
  }
}
