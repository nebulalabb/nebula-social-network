import { Router } from "express";
import { UsersController } from "./users.controller";
import { protect, optionalAuth } from "../../middlewares/auth.middleware";
import { getCoinBalance } from "../shop/shop.controller";

const router = Router();
const ctrl = new UsersController();

router.get("/me", protect, ctrl.getMe.bind(ctrl));
router.get("/me/coins", protect, getCoinBalance);
router.get("/search", ctrl.searchUsers.bind(ctrl));
router.put("/me/profile", protect, ctrl.updateProfile.bind(ctrl));
router.put("/me/status", protect, ctrl.updateStatus.bind(ctrl));
router.post("/me/daily-login", protect, ctrl.claimDailyLogin.bind(ctrl));
router.get("/me/blocked", protect, ctrl.getBlockedUsers.bind(ctrl));
router.get("/me/wrapped", protect, ctrl.getWrapped.bind(ctrl));
router.get("/me/personality", protect, ctrl.getAnimePersonality.bind(ctrl));
router.post("/block/:userId", protect, ctrl.blockUser.bind(ctrl));
router.delete("/block/:userId", protect, ctrl.unblockUser.bind(ctrl));
router.get("/admin/stats", protect, ctrl.getAdminStats.bind(ctrl));
router.get("/me/spoiler-settings", protect, ctrl.getSpoilerSettings.bind(ctrl));
router.put("/me/spoiler-settings/:animeId", protect, ctrl.upsertSpoilerSetting.bind(ctrl));
router.get("/:id/animelist", ctrl.getUserAnimeList.bind(ctrl));
router.get("/:id/mangalist", ctrl.getUserMangaList.bind(ctrl));
router.get("/:id/personality", optionalAuth, ctrl.getAnimePersonality.bind(ctrl));
router.get("/:username", optionalAuth, ctrl.getByUsername.bind(ctrl));

export default router;
