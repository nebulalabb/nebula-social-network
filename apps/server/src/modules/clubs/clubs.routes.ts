import { Router } from "express";
import { ClubsController } from "./clubs.controller";
import { authenticate, optionalAuth } from "../../middlewares/auth.middleware";

const router = Router();
const ctrl = new ClubsController();

router.get("/", optionalAuth, ctrl.getList.bind(ctrl));
router.post("/", authenticate, ctrl.create.bind(ctrl));
router.get("/me", authenticate, ctrl.getMyClubs.bind(ctrl));
router.get("/:id", optionalAuth, ctrl.getById.bind(ctrl));
router.put("/:id", authenticate, ctrl.update.bind(ctrl));
router.delete("/:id", authenticate, ctrl.delete.bind(ctrl));
router.post("/:id/join", authenticate, ctrl.join.bind(ctrl));
router.post("/:id/leave", authenticate, ctrl.leave.bind(ctrl));

export default router;
