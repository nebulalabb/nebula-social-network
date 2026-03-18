import Redis from "ioredis";
import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  logger.info("🚀 Connected to Redis");
});

redis.on("error", (err) => {
  logger.error("❌ Redis error:", err);
});
