import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";

export const getSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const sub = await prisma.premiumSubscription.findUnique({ where: { userId } });
    res.json({ success: true, data: sub });
  } catch (err) { next(err); }
};

export const subscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { plan = "MONTHLY" } = req.body;

    const endAt = new Date();
    if (plan === "YEARLY") endAt.setFullYear(endAt.getFullYear() + 1);
    else endAt.setMonth(endAt.getMonth() + 1);

    const sub = await prisma.premiumSubscription.upsert({
      where: { userId },
      create: { userId, plan, status: "ACTIVE", endAt },
      update: { plan, status: "ACTIVE", endAt, startAt: new Date() },
    });

    // Award coins on subscribe
    const coins = plan === "YEARLY" ? 700 : 50;
    await prisma.coinTransaction.create({
      data: { userId, type: "EARN", amount: coins, description: `Premium ${plan} reward` },
    });

    // In production: redirect to VNPay/Stripe payment URL
    // For now return success directly
    res.json({ success: true, data: sub });
  } catch (err) { next(err); }
};

export const cancelSubscription = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    await prisma.premiumSubscription.update({
      where: { userId },
      data: { status: "CANCELLED" },
    });
    res.json({ success: true, message: "Đã hủy đăng ký Premium" });
  } catch (err) { next(err); }
};
