import { Router } from "express";
import { roomController } from "./room.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.get("/my", protect, roomController.getMyRoom);
router.get("/public", roomController.getPublicRooms);
router.get("/", roomController.getPublicRooms); // supports ?isPublic=true&limit=4&sort=active
router.get("/assets", roomController.getAssets);
router.get("/:id", roomController.getRoom);
router.patch("/:id", protect, roomController.updateRoom);
router.post("/:id/decors", protect, roomController.saveDecors);

export default router;
