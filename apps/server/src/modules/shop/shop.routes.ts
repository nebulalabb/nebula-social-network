import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import { getCoinBalance, buyItem } from "./shop.controller";

const router = Router();

router.get("/balance", protect, getCoinBalance);
router.post("/buy", protect, buyItem);

export default router;
