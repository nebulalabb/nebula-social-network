import { Router } from "express";
import { ScheduleService } from "./schedule.service";

const router = Router();
const svc = new ScheduleService();

router.get("/", async (req, res, next) => {
  try {
    const data = await svc.getWeeklySchedule();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/today", async (req, res, next) => {
  try {
    const data = await svc.getTodaySchedule();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/upcoming", async (req, res, next) => {
  try {
    const data = await svc.getUpcomingAnime(Number(req.query.page) || 1);
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
