import { Router } from "express";
import { MangaController } from "./manga.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const ctrl = new MangaController();

router.get("/", ctrl.getList.bind(ctrl));
router.get("/search", ctrl.search.bind(ctrl));
router.get("/top", ctrl.getTop.bind(ctrl));
router.get("/:id", ctrl.getById.bind(ctrl));
router.get("/:id/characters", ctrl.getCharacters.bind(ctrl));
router.get("/me/list", authenticate, ctrl.getMyList.bind(ctrl));
router.put("/list/:mangaId", authenticate, ctrl.upsertList.bind(ctrl));
router.delete("/list/:mangaId", authenticate, ctrl.removeFromList.bind(ctrl));

export default router;
