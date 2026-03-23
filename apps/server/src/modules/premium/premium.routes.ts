import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import { getSubscription, subscribe, cancelSubscription } from "./premium.controller";

const router = Router();

router.get("/subscription", protect, getSubscription);
router.post("/subscribe", protect, subscribe);
router.delete("/subscription", protect, cancelSubscription);

export default router;
