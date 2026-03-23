import { Router } from "express";
import axios from "axios";
import { redis } from "../../config/redis";

const router = Router();
const JIKAN_BASE = "https://api.jikan.moe/v4";
const CACHE_TTL = 60 * 30; // 30 phút

async function cachedGet(key: string, fetcher: () => Promise<any>) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const data = await fetcher();
  await redis.setex(key, CACHE_TTL, JSON.stringify(data));
  return data;
}

// Jikan không có global news endpoint, dùng top anime news từ popular series
router.get("/anime", async (req, res, next) => {
  try {
    const data = await cachedGet("news:anime", async () => {
      // Lấy news từ top anime phổ biến
      const popularIds = [21, 1535, 16498, 38000, 40748]; // One Piece, Death Note, AoT, Demon Slayer, JJK
      const newsItems: any[] = [];
      for (const id of popularIds.slice(0, 3)) {
        try {
          const { data } = await axios.get(`${JIKAN_BASE}/anime/${id}/news`, { params: { limit: 5 } });
          const items = (data.data || []).map((n: any) => ({
            ...n,
            animeId: id,
          }));
          newsItems.push(...items);
          await new Promise((r) => setTimeout(r, 400)); // Rate limit
        } catch {}
      }
      return newsItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/manga", async (req, res, next) => {
  try {
    const data = await cachedGet("news:manga", async () => {
      const popularIds = [13, 2, 656, 23390]; // Naruto, Berserk, Vinland Saga, Tokyo Ghoul
      const newsItems: any[] = [];
      for (const id of popularIds.slice(0, 3)) {
        try {
          const { data } = await axios.get(`${JIKAN_BASE}/manga/${id}/news`, { params: { limit: 5 } });
          newsItems.push(...(data.data || []));
          await new Promise((r) => setTimeout(r, 400));
        } catch {}
      }
      return newsItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
