import { Router } from "express";
import { avatarController } from "./avatar.controller";
import { protect } from "../../middlewares/auth.middleware";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB for VRM

router.get("/me", protect, avatarController.getMyAvatar);
router.put("/me", protect, avatarController.upsertAvatar);
router.post("/me/upload-vrm", protect, upload.single("vrm"), avatarController.uploadVRM);
router.get("/user/:userId", avatarController.getAvatarByUser);

export default router;
