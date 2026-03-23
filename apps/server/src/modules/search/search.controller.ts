import { Request, Response, NextFunction } from "express";
import { esClient } from "../../config/elasticsearch";
import { prisma } from "../../config/database";

export const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, type, limit = "10" } = req.query as Record<string, string>;
    if (!q?.trim()) return res.json({ success: true, data: { anime: [], manga: [], users: [], posts: [] } });

    const lim = Math.min(parseInt(limit), 20);
    const result: Record<string, any[]> = { anime: [], manga: [], users: [], posts: [] };

    const types = type ? [type] : ["anime", "manga", "users", "posts"];

    await Promise.allSettled([
      // Anime search via Prisma (fallback when ES not available)
      types.includes("anime") && prisma.animeEntry.findMany({
        where: {
          OR: [
            { titleEn: { contains: q, mode: "insensitive" } },
            { titleJp: { contains: q, mode: "insensitive" } },
            { titleRo: { contains: q, mode: "insensitive" } },
          ],
        },
        take: lim,
      }).then((rows) => { result.anime = rows; }),

      // Manga search
      types.includes("manga") && prisma.mangaEntry.findMany({
        where: {
          OR: [
            { titleEn: { contains: q, mode: "insensitive" } },
            { titleJp: { contains: q, mode: "insensitive" } },
          ],
        },
        take: lim,
      }).then((rows) => { result.manga = rows; }),

      // User search
      types.includes("users") && prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { profile: { displayName: { contains: q, mode: "insensitive" } } },
          ],
          deletedAt: null,
        },
        include: { profile: { select: { displayName: true, avatarUrl: true } } },
        take: lim,
      }).then((rows) => { result.users = rows; }),
    ]);

    // Posts search via Elasticsearch if available
    if (types.includes("posts")) {
      try {
        const esRes = await esClient.search({
          index: "posts",
          body: {
            query: {
              multi_match: {
                query: q,
                fields: ["content^2", "hashtags"],
                fuzziness: "AUTO",
              },
            },
            size: lim,
          },
        });
        result.posts = (esRes.hits?.hits || []).map((h: any) => ({ _id: h._id, ...h._source }));
      } catch {
        // ES not available — skip posts
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
