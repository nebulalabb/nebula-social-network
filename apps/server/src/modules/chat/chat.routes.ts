import { Router } from "express";
import { ChatController } from "./chat.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const ctrl = new ChatController();

router.use(authenticate);

router.get("/", ctrl.getConversations.bind(ctrl));
router.post("/direct/:userId", ctrl.getOrCreateDirect.bind(ctrl));
router.post("/group", ctrl.createGroup.bind(ctrl));

router.get("/:id/messages", ctrl.getMessages.bind(ctrl));
router.post("/:id/messages", ctrl.sendMessage.bind(ctrl));
router.delete("/:id/messages/:msgId", ctrl.deleteMessage.bind(ctrl));
router.put("/:id/read", ctrl.markRead.bind(ctrl));
router.post("/:id/members", ctrl.addMember.bind(ctrl));
router.post("/:id/leave", ctrl.leaveConversation.bind(ctrl));

export default router;
