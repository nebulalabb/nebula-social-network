import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import * as fanArtCtrl from "./fanArt.controller";
import * as fanFicCtrl from "./fanFic.controller";
import * as cosplayCtrl from "./cosplay.controller";

const router = Router();

// ── FanArt ────────────────────────────────────────────────────────────────────
router.get("/fanart", fanArtCtrl.list);
router.get("/fanart/:id", fanArtCtrl.getOne);
router.post("/fanart", protect, fanArtCtrl.create);
router.delete("/fanart/:id", protect, fanArtCtrl.remove);
router.post("/fanart/:id/react", protect, fanArtCtrl.react);

// ── FanFic ────────────────────────────────────────────────────────────────────
router.get("/fanfic", fanFicCtrl.list);
router.get("/fanfic/:id", fanFicCtrl.getOne);
router.post("/fanfic", protect, fanFicCtrl.create);
router.delete("/fanfic/:id", protect, fanFicCtrl.remove);
router.post("/fanfic/:id/chapters", protect, fanFicCtrl.addChapter);
router.get("/fanfic/:id/chapters/:chapterId", fanFicCtrl.getChapter);
router.put("/fanfic/:id/chapters/:chapterId", protect, fanFicCtrl.updateChapter);

// ── Cosplay ───────────────────────────────────────────────────────────────────
router.get("/cosplay", cosplayCtrl.list);
router.get("/cosplay/:id", cosplayCtrl.getOne);
router.post("/cosplay", protect, cosplayCtrl.create);
router.delete("/cosplay/:id", protect, cosplayCtrl.remove);

export default router;
