import { Router } from "express";
import { EventsService } from "./events.service";
import { authenticate, optionalAuth } from "../../middlewares/auth.middleware";
import { AppError } from "../../middlewares/error.middleware";

const router = Router();
const svc = new EventsService();

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const data = await svc.getEvents(req.query as any);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const data = await svc.createEvent(req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const data = await svc.getEventById(req.params.id);
    if (!data) throw new AppError(404, "Sự kiện không tồn tại");
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post("/:id/join", authenticate, async (req, res, next) => {
  try {
    await svc.joinEvent(req.params.id, req.user!.id);
    res.json({ success: true, message: "Đã tham gia sự kiện" });
  } catch (err) { next(new AppError(400, (err as Error).message)); }
});

router.post("/:id/leave", authenticate, async (req, res, next) => {
  try {
    await svc.leaveEvent(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
