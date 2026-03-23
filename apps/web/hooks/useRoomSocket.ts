"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/use-auth-store";

export interface RemotePlayer {
  userId: string;
  username: string;
  avatarUrl?: string;
  vrmUrl?: string;
  hairColor?: string;
  clothColor?: string;
  position: [number, number, number];
  rotation: number;
  emote?: string;
  hp?: number;
  maxHp?: number;
  animation?: string;
}

interface UseRoomSocketOptions {
  roomId: string;
  onPlayerJoin?: (player: RemotePlayer) => void;
  onPlayerLeave?: (userId: string) => void;
  onPlayerMove?: (userId: string, position: [number, number, number], rotation: number) => void;
  onPlayerEmote?: (userId: string, emote: string) => void;
  onDecorUpdate?: (decors: any[]) => void;
  onCombatEvent?: (event: { type: string; targetId: string; attackerId?: string; amount?: number; skillId?: string }) => void;
}

export function useRoomSocket({
  roomId,
  onPlayerJoin,
  onPlayerLeave,
  onPlayerMove,
  onPlayerEmote,
  onDecorUpdate,
  onCombatEvent,
}: UseRoomSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<Map<string, RemotePlayer>>(new Map());
  const { user } = useAuthStore();

  useEffect(() => {
    if (!roomId || !user) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000", {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("room:join", {
        roomId,
        vrmUrl: (user as any)?.avatar?.vrmUrl ?? undefined,
        hairColor: (user as any)?.avatar?.hairColor ?? undefined,
        clothColor: (user as any)?.avatar?.clothColor ?? undefined,
      });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("room:players", (existingPlayers: RemotePlayer[]) => {
      const map = new Map<string, RemotePlayer>();
      existingPlayers.forEach((p) => map.set(p.userId, p));
      setPlayers(map);
    });

    socket.on("room:player:joined", (player: RemotePlayer) => {
      setPlayers((prev) => new Map(prev).set(player.userId, player));
      onPlayerJoin?.(player);
    });

    socket.on("room:player:left", ({ userId }: { userId: string }) => {
      setPlayers((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      onPlayerLeave?.(userId);
    });

    socket.on("avatar:moved", ({ userId, position, rotation }: { userId: string; position: [number, number, number]; rotation: number }) => {
      setPlayers((prev) => {
        const next = new Map(prev);
        const p = next.get(userId);
        if (p) next.set(userId, { ...p, position, rotation });
        return next;
      });
      onPlayerMove?.(userId, position, rotation);
    });

    socket.on("avatar:emoted", ({ userId, emote }: { userId: string; emote: string }) => {
      setPlayers((prev) => {
        const next = new Map(prev);
        const p = next.get(userId);
        if (p) next.set(userId, { ...p, emote });
        return next;
      });
      onPlayerEmote?.(userId, emote);
    });

    socket.on("room:decor:updated", ({ decors }: { decors: any[] }) => {
      onDecorUpdate?.(decors);
    });

    // Combat events
    socket.on("combat:event", (event: any) => {
      onCombatEvent?.(event);
      // Update HP của remote player
      if (event.type === "damage" || event.type === "heal") {
        setPlayers((prev) => {
          const next = new Map(prev);
          const p = next.get(event.targetId);
          if (p) next.set(event.targetId, { ...p, hp: event.hp });
          return next;
        });
      }
    });

    return () => {
      socket.emit("room:leave", { roomId });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [roomId, user]);

  const sendMove = useCallback((position: [number, number, number], rotation: number) => {
    socketRef.current?.emit("avatar:move", { roomId, position, rotation });
  }, [roomId]);

  const sendEmote = useCallback((emote: string) => {
    socketRef.current?.emit("avatar:emote", { roomId, emote });
  }, [roomId]);

  const sendDecorUpdate = useCallback((decors: any[]) => {
    socketRef.current?.emit("room:decor:update", { roomId, decors });
  }, [roomId]);

  const sendCombatEvent = useCallback((event: {
    type: string;
    targetId?: string;
    skillId?: string;
    position?: [number, number, number];
  }) => {
    socketRef.current?.emit("combat:action", { roomId, ...event });
  }, [roomId]);

  return { connected, players, sendMove, sendEmote, sendDecorUpdate, sendCombatEvent };
}
