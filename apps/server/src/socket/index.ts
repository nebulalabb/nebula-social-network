import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

// Map userId → Set of socketIds
const onlineUsers = new Map<string, Set<string>>();

// Room state: roomId → Map<socketId, playerState>
type PlayerState = {
  userId: string;
  username?: string;
  avatarUrl?: string;
  vrmUrl?: string;
  hairColor?: string;
  clothColor?: string;
  x: number; y: number; z: number; ry: number;
  pose?: string;
  emote?: string;
  isSpeaking?: boolean;
  hp?: number;
  animation?: string;
};
const roomPlayers = new Map<string, Map<string, PlayerState>>();

export let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
        if (origin === process.env.FRONTEND_URL) return callback(null, true);
        callback(new Error("Socket CORS not allowed"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) return next(new Error("Unauthorized"));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
      (socket as any).userId = payload.id || payload.sub;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId as string;
    logger.info(`🔌 [socket]: ${userId} connected (${socket.id})`);

    // Track online
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);
    socket.join(`user:${userId}`);
    io.emit("user:online", { userId });

    // ─── Chat ──────────────────────────────────────────────────────────────
    socket.on("chat:join", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on("chat:leave", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on("chat:send", (data: { conversationId: string; message: any }) => {
      io.to(`conv:${data.conversationId}`).emit("chat:receive", {
        ...data.message,
        senderId: userId,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("chat:typing", (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit("chat:typing", { userId, conversationId });
    });

    socket.on("chat:stop-typing", (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit("chat:stop-typing", { userId, conversationId });
    });

    socket.on("chat:seen", (data: { conversationId: string; messageId: string }) => {
      socket.to(`conv:${data.conversationId}`).emit("chat:seen", { userId, ...data });
    });

    // ─── Room ──────────────────────────────────────────────────────────────
    socket.on("room:join", ({
      roomId, username, avatarUrl, vrmUrl, hairColor, clothColor,
    }: {
      roomId: string; username?: string; avatarUrl?: string;
      vrmUrl?: string; hairColor?: string; clothColor?: string;
    }) => {
      socket.join(`room:${roomId}`);
      if (!roomPlayers.has(roomId)) roomPlayers.set(roomId, new Map());
      const players = roomPlayers.get(roomId)!;
      players.set(socket.id, {
        userId, username, avatarUrl, vrmUrl, hairColor, clothColor,
        x: 0, y: 0, z: 0, ry: 0, hp: 100,
      });

      // Gửi danh sách players hiện tại cho người mới (format client mong đợi)
      const playerList = Array.from(players.entries())
        .filter(([sid]) => sid !== socket.id)
        .map(([, s]) => ({
          userId: s.userId,
          username: s.username,
          avatarUrl: s.avatarUrl,
          vrmUrl: s.vrmUrl,
          hairColor: s.hairColor,
          clothColor: s.clothColor,
          position: [s.x, s.y, s.z] as [number, number, number],
          rotation: s.ry,
          emote: s.emote,
          hp: s.hp ?? 100,
        }));
      socket.emit("room:players", playerList);

      // Thông báo cho người khác
      socket.to(`room:${roomId}`).emit("room:player:joined", {
        userId, username, avatarUrl, vrmUrl, hairColor, clothColor,
        position: [0, 0, 0] as [number, number, number],
        rotation: 0,
        hp: 100,
      });
      logger.info(`🏠 [room]: ${userId} joined room ${roomId}`);
    });

    socket.on("room:leave", ({ roomId }: { roomId: string }) => {
      socket.leave(`room:${roomId}`);
      roomPlayers.get(roomId)?.delete(socket.id);
      socket.to(`room:${roomId}`).emit("room:player:left", { userId });
    });

    socket.on("avatar:move", ({
      roomId, position, rotation,
    }: {
      roomId: string;
      position: [number, number, number];
      rotation: number;
    }) => {
      const players = roomPlayers.get(roomId);
      if (players?.has(socket.id)) {
        const current = players.get(socket.id)!;
        players.set(socket.id, {
          ...current,
          x: position[0], y: position[1], z: position[2], ry: rotation,
        });
      }
      socket.to(`room:${roomId}`).emit("avatar:moved", { userId, position, rotation });
    });

    socket.on("avatar:emote", ({ roomId, emote }: { roomId: string; emote: string }) => {
      const players = roomPlayers.get(roomId);
      if (players?.has(socket.id)) {
        const current = players.get(socket.id)!;
        players.set(socket.id, { ...current, emote });
      }
      socket.to(`room:${roomId}`).emit("avatar:emoted", { userId, emote });
      // Tự xóa emote sau 3 giây
      setTimeout(() => {
        const p = roomPlayers.get(roomId);
        if (p?.has(socket.id)) {
          const c = p.get(socket.id)!;
          p.set(socket.id, { ...c, emote: undefined });
        }
        socket.to(`room:${roomId}`).emit("avatar:emoted", { userId, emote: null });
      }, 3000);
    });

    socket.on("room:decor:update", ({ roomId, decors }: { roomId: string; decors: any[] }) => {
      socket.to(`room:${roomId}`).emit("room:decor:updated", { decors });
    });

    // ─── Combat ────────────────────────────────────────────────────────────
    socket.on("combat:action", ({
      roomId, type, targetId, skillId, position,
    }: {
      roomId: string;
      type: string;
      targetId?: string;
      skillId?: string;
      position?: [number, number, number];
    }) => {
      // Broadcast combat event tới room
      socket.to(`room:${roomId}`).emit("combat:event", {
        type,
        attackerId: userId,
        targetId,
        skillId,
        position,
        amount: skillId === "blast" ? 30 : skillId === "slash" ? 15 : skillId === "dash" ? 10 : 0,
      });

      // Nếu có target cụ thể, gửi riêng cho target
      if (targetId) {
        // Tìm socket của target trong room
        const players = roomPlayers.get(roomId);
        if (players) {
          for (const [sid, p] of players.entries()) {
            if (p.userId === targetId) {
              io.to(sid).emit("combat:event", {
                type: "damage",
                attackerId: userId,
                targetId,
                skillId,
                amount: skillId === "blast" ? 30 : skillId === "slash" ? 15 : 10,
              });
              break;
            }
          }
        }
      }
    });

    // ─── Voice signaling ───────────────────────────────────────────────────
    socket.on("voice:join", ({ roomId }: { roomId: string }) => {
      socket.join(`voice:${roomId}`);
      socket.to(`voice:${roomId}`).emit("voice:user-joined", { socketId: socket.id, userId });
    });

    socket.on("voice:offer", ({ to, offer }: { to: string; offer: any }) => {
      io.to(to).emit("voice:offer", { from: socket.id, offer });
    });

    socket.on("voice:answer", ({ to, answer }: { to: string; answer: any }) => {
      io.to(to).emit("voice:answer", { from: socket.id, answer });
    });

    socket.on("voice:ice", ({ to, candidate }: { to: string; candidate: any }) => {
      io.to(to).emit("voice:ice", { from: socket.id, candidate });
    });

    socket.on("voice:leave", ({ roomId }: { roomId: string }) => {
      socket.leave(`voice:${roomId}`);
      socket.to(`voice:${roomId}`).emit("voice:user-left", { socketId: socket.id, userId });
    });

    socket.on("voice:speaking", ({ roomId, isSpeaking }: { roomId: string; isSpeaking: boolean }) => {
      const players = roomPlayers.get(roomId);
      if (players?.has(socket.id)) {
        const current = players.get(socket.id)!;
        players.set(socket.id, { ...current, isSpeaking });
      }
      socket.to(`room:${roomId}`).emit("avatar:speaking", { userId, isSpeaking });
    });

    // ─── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit("user:offline", { userId });
        }
      }
      // Xóa khỏi tất cả room
      roomPlayers.forEach((players, roomId) => {
        if (players.has(socket.id)) {
          players.delete(socket.id);
          io.to(`room:${roomId}`).emit("room:player:left", { userId });
        }
      });
      logger.info(`🔌 [socket]: ${userId} disconnected (${socket.id})`);
    });
  });

  return io;
};

// Helper: emit notification to specific user
export const emitNotification = (userId: string, notification: any) => {
  io?.to(`user:${userId}`).emit("notification:new", notification);
};

export const isUserOnline = (userId: string) => onlineUsers.has(userId);
