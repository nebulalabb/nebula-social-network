import { redis } from "../../config/redis";
import { logger } from "../../utils/logger";

export interface SessionInfo {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent: string;
  ip: string;
  lastUsed: number;
}

export class SessionService {
  private static PREFIX = "session:";

  static async createSession(userId: string, refreshToken: string, ip: string, userAgent: string) {
    const sessionId = Math.random().toString(36).substring(7);
    const session: SessionInfo = {
      id: sessionId,
      userId,
      refreshToken,
      ip,
      userAgent,
      lastUsed: Date.now(),
    };

    // Store session for 30 days
    await redis.set(
      `${this.PREFIX}${sessionId}`,
      JSON.stringify(session),
      "EX",
      30 * 24 * 60 * 60
    );

    // Also store sessionId in a set for the user to list all sessions
    await redis.sadd(`user_sessions:${userId}`, sessionId);
    
    return sessionId;
  }

  static async getSessions(userId: string): Promise<SessionInfo[]> {
    const sessionIds = await redis.smembers(`user_sessions:${userId}`);
    const sessions: SessionInfo[] = [];

    for (const id of sessionIds) {
      const data = await redis.get(`${this.PREFIX}${id}`);
      if (data) {
        sessions.push(JSON.parse(data));
      } else {
        // Cleanup expired sessions from set
        await redis.srem(`user_sessions:${userId}`, id);
      }
    }

    return sessions;
  }

  static async revokeSession(userId: string, sessionId: string) {
    await redis.del(`${this.PREFIX}${sessionId}`);
    await redis.srem(`user_sessions:${userId}`, sessionId);
  }

  static async revokeAllSessions(userId: string) {
    const sessionIds = await redis.smembers(`user_sessions:${userId}`);
    for (const id of sessionIds) {
      await redis.del(`${this.PREFIX}${id}`);
    }
    await redis.del(`user_sessions:${userId}`);
  }
}
