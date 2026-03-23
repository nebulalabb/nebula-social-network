import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import { getLiveKitToken } from "./livekit.controller";

const router = Router();

// GET /livekit/token/:roomId — get a LiveKit JWT for the given room
router.get("/token/:roomId", protect, getLiveKitToken);

export default router;
