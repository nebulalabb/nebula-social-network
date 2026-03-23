import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const ctrl = new NotificationController();

router.use(authenticate);
router.get("/", ctrl.getAll.bind(ctrl));
router.get("/unread-count", ctrl.getUnreadCount.bind(ctrl));
router.put("/read-all", ctrl.markAllRead.bind(ctrl));
router.put("/:id/read", ctrl.markRead.bind(ctrl));
router.delete("/:id", ctrl.delete.bind(ctrl));

export default router;
