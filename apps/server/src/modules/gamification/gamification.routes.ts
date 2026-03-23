import { Router } from "express";
import { GamificationController } from "./gamification.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const ctrl = new GamificationController();

router.get("/leaderboard", ctrl.getLeaderboard.bind(ctrl));
router.get("/me", authenticate, ctrl.getMyStats.bind(ctrl));
router.get("/users/:userId", ctrl.getUserStats.bind(ctrl));

export default router;
