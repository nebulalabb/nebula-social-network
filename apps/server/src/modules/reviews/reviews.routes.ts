import { Router } from "express";
import { ReviewsController } from "./reviews.controller";
import { authenticate, optionalAuth } from "../../middlewares/auth.middleware";

const router = Router();
const ctrl = new ReviewsController();

router.post("/", authenticate, ctrl.create.bind(ctrl));
router.get("/me", authenticate, ctrl.getMyReviews.bind(ctrl));
router.get("/:entityType/:entityId", optionalAuth, ctrl.getByEntity.bind(ctrl));
router.put("/:id", authenticate, ctrl.update.bind(ctrl));
router.delete("/:id", authenticate, ctrl.delete.bind(ctrl));
router.post("/:id/helpful", authenticate, ctrl.markHelpful.bind(ctrl));

export default router;
