import axios from "axios";
import { redis } from "../../config/redis";

const JIKAN_BASE = "https://api.jikan.moe/v4";
const CACHE_TTL = 60 * 60 * 6; // 6 giờ

export class ScheduleService {
  private async cachedGet(key: string, fetcher: () => Promise<any>) {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    const data = await fetcher();
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
    return data;
  }

  async getWeeklySchedule() {
    return this.cachedGet("schedule:weekly", async () => {
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const results: Record<string, any[]> = {};
      for (const day of days) {
        try {
          const { data } = await axios.get(`${JIKAN_BASE}/schedules`, { params: { filter: day, limit: 25 } });
          results[day] = data.data || [];
        } catch {
          results[day] = [];
        }
      }
      return results;
    });
  }

  async getTodaySchedule() {
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const today = dayNames[new Date().getDay()];
    return this.cachedGet(`schedule:${today}`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/schedules`, { params: { filter: today, limit: 25 } });
      return { day: today, items: data.data || [] };
    });
  }

  async getUpcomingAnime(page = 1) {
    return this.cachedGet(`schedule:upcoming:${page}`, async () => {
      const { data } = await axios.get(`${JIKAN_BASE}/seasons/upcoming`, { params: { page } });
      return { items: data.data || [], pagination: data.pagination };
    });
  }
}
