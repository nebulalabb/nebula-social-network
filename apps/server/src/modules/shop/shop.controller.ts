import { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database";

// Static shop catalog — extend with DB model later
const SHOP_ITEMS: Record<string, { name: string; price: number; category: string }> = {
  "1": { name: "Khung Sakura", price: 100, category: "avatar_frame" },
  "2": { name: "Khung Rồng Vàng", price: 500, category: "avatar_frame" },
  "3": { name: "Bàn Anime", price: 80, category: "room_item" },
  "4": { name: "Poster Naruto", price: 30, category: "room_item" },
  "5": { name: "Huy hiệu Otaku", price: 200, category: "badge" },
  "6": { name: "Emote Kawaii", price: 50, category: "emote" },
  "7": { name: "Danh hiệu Senpai", price: 150, category: "title" },
  "8": { name: "Đèn Lồng Nhật", price: 60, category: "room_item" },
};

export const getCoinBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const txs = await prisma.coinTransaction.findMany({ where: { userId } });
    const balance = txs.reduce((sum, t) => {
      if (t.type === "PURCHASE" || t.type === "SPEND" || t.type === "DONATE") return sum - t.amount;
      return sum + t.amount;
    }, 0);
    res.json({ success: true, data: { balance } });
  } catch (err) { next(err); }
};

export const buyItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { itemId } = req.body;

    const item = SHOP_ITEMS[itemId];
    if (!item) return res.status(404).json({ success: false, message: "Vật phẩm không tồn tại" });

    // Check balance
    const txs = await prisma.coinTransaction.findMany({ where: { userId } });
    const balance = txs.reduce((sum, t) => {
      if (t.type === "PURCHASE" || t.type === "SPEND" || t.type === "DONATE") return sum - t.amount;
      return sum + t.amount;
    }, 0);

    if (balance < item.price) {
      return res.status(400).json({ success: false, message: "Không đủ Coin" });
    }

    await prisma.coinTransaction.create({
      data: { userId, type: "SPEND", amount: item.price, description: `Mua: ${item.name}` },
    });

    res.json({ success: true, data: { item, newBalance: balance - item.price } });
  } catch (err) { next(err); }
};
