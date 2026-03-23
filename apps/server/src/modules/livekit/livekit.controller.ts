import { Request, Response } from "express";
import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY ?? "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET ?? "devsecret";

export async function getLiveKitToken(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const username = (req as any).user?.username ?? "guest";
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({ success: false, message: "roomId required" });
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId ?? `guest-${Date.now()}`,
      name: username,
      ttl: "4h",
    });

    at.addGrant({
      roomJoin: true,
      room: `room-${roomId}`,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return res.json({
      success: true,
      data: {
        token,
        url: process.env.LIVEKIT_URL ?? "ws://localhost:7880",
        room: `room-${roomId}`,
      },
    });
  } catch (err) {
    console.error("LiveKit token error:", err);
    return res.status(500).json({ success: false, message: "Token generation failed" });
  }
}
