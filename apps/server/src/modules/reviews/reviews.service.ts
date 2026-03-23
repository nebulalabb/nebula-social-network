import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

export class ReviewsService {
  async createReview(userId: string, data: {
    entityType: "ANIME" | "MANGA";
    entityId: string;
    scoreTotal: number;
    scoreDetail?: Record<string, number>;
    content: string;
    hasSpoiler?: boolean;
  }) {
    const existing = await prisma.review.findFirst({
      where: { userId, entityType: data.entityType, entityId: data.entityId },
    });
    if (existing) throw new AppError(400, "Bạn đã viết review cho tác phẩm này");

    const review = await prisma.review.create({
      data: { ...data, userId },
      include: {
        user: { select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });
    return review;
  }

  async getReviews(entityType: string, entityId: string, page = 1, limit = 10) {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { entityType, entityId },
        include: {
          user: { select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { entityType, entityId } }),
    ]);

    const avgScore = reviews.length
      ? reviews.reduce((sum, r) => sum + r.scoreTotal, 0) / reviews.length
      : 0;

    return { reviews, total, avgScore: Math.round(avgScore * 10) / 10, page, totalPages: Math.ceil(total / limit) };
  }

  async updateReview(reviewId: string, userId: string, data: Partial<{ scoreTotal: number; scoreDetail: any; content: string; hasSpoiler: boolean }>) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError(404, "Review không tồn tại");
    if (review.userId !== userId) throw new AppError(403, "Không có quyền chỉnh sửa");
    return prisma.review.update({ where: { id: reviewId }, data });
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError(404, "Review không tồn tại");
    if (review.userId !== userId) throw new AppError(403, "Không có quyền xóa");
    await prisma.review.delete({ where: { id: reviewId } });
  }

  async getUserReviews(userId: string, page = 1, limit = 10) {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { userId } }),
    ]);
    return { reviews, total, page, totalPages: Math.ceil(total / limit) };
  }

  async markHelpful(reviewId: string) {
    return prisma.review.update({
      where: { id: reviewId },
      data: { isHelpful: { increment: 1 } },
    });
  }
}
