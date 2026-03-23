import { Post } from "./post.model";
import { Comment } from "./comment.model";
import { Bookmark } from "./bookmark.model";
import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";
import { GamificationService } from "../gamification/gamification.service";

const gamification = new GamificationService();

export class PostsService {
  async createPost(userId: string, data: {
    content: string;
    media?: { type: "IMAGE" | "VIDEO"; url: string; thumbnailUrl?: string }[];
    hashtags?: string[];
    visibility?: "PUBLIC" | "FRIENDS" | "PRIVATE";
    hasSpoiler?: boolean;
    tags?: { animeIds?: string[]; mangaIds?: string[]; mentionedUserIds?: string[] };
  }) {
    const post = await Post.create({
      userId,
      content: data.content,
      media: data.media || [],
      hashtags: data.hashtags || [],
      visibility: data.visibility || "PUBLIC",
      hasSpoiler: data.hasSpoiler || false,
      tags: data.tags || { animeIds: [], mangaIds: [], mentionedUserIds: [] },
    });
    // Award EXP
    await gamification.addExp(userId, "POST_CREATED").catch(() => {});
    return this.enrichPost(post.toObject(), userId);
  }

  async getFeed(userId: string, cursor?: string, limit = 20) {
    // Lấy danh sách bạn bè + following
    const [friendships, follows, spoilerSettings] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
        select: { senderId: true, receiverId: true },
      }),
      prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      }),
      prisma.spoilerSetting.findMany({
        where: { userId },
        select: { animeId: true, progress: true },
      }),
    ]);

    const friendIds = friendships.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId
    );
    const followingIds = follows.map((f) => f.followingId);
    const authorIds = [...new Set([userId, ...friendIds, ...followingIds])];

    const query: any = {
      userId: { $in: authorIds },
      visibility: { $in: ["PUBLIC", "FRIENDS"] },
    };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Build spoiler map: animeId -> progress
    const spoilerMap = new Map(spoilerSettings.map((s) => [s.animeId, s.progress]));

    const enriched = await Promise.all(
      posts.map((p) => this.enrichPost(p, userId, spoilerMap))
    );
    const nextCursor = posts.length === limit ? posts[posts.length - 1].createdAt.toISOString() : null;

    return { posts: enriched, nextCursor };
  }

  async getPostById(postId: string, userId?: string) {
    const post = await Post.findById(postId).lean();
    if (!post) throw new AppError(404, "Bài đăng không tồn tại");
    return this.enrichPost(post, userId);
  }

  async getUserPosts(targetUserId: string, viewerId?: string, cursor?: string, limit = 20) {
    const query: any = { userId: targetUserId };
    if (viewerId !== targetUserId) {
      query.visibility = "PUBLIC";
    }
    if (cursor) query.createdAt = { $lt: new Date(cursor) };

    const posts = await Post.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    const enriched = await Promise.all(posts.map((p) => this.enrichPost(p, viewerId)));
    const nextCursor = posts.length === limit ? posts[posts.length - 1].createdAt.toISOString() : null;
    return { posts: enriched, nextCursor };
  }

  async deletePost(postId: string, userId: string) {
    const post = await Post.findById(postId);
    if (!post) throw new AppError(404, "Bài đăng không tồn tại");
    if (post.userId !== userId) throw new AppError(403, "Không có quyền xóa bài đăng này");
    await post.deleteOne();
  }

  async reactToPost(postId: string, userId: string, type: string) {
    // Dùng MongoDB để lưu reactions (đơn giản hóa: lưu trong Redis hoặc collection riêng)
    // Tạm thời tăng reactionCount
    await Post.findByIdAndUpdate(postId, { $inc: { "engagement.reactionCount": 1 } });
    return { success: true };
  }

  async removeReaction(postId: string, userId: string) {
    await Post.findByIdAndUpdate(postId, { $inc: { "engagement.reactionCount": -1 } });
    return { success: true };
  }

  async addComment(postId: string, userId: string, content: string, parentId?: string) {
    const post = await Post.findById(postId);
    if (!post) throw new AppError(404, "Bài đăng không tồn tại");

    const comment = await Comment.create({ postId, userId, content, parentId: parentId || null });
    await Post.findByIdAndUpdate(postId, { $inc: { "engagement.commentCount": 1 } });
    // Award EXP
    await gamification.addExp(userId, "COMMENT_ADDED").catch(() => {});

    const author = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } },
    });

    return {
      ...comment.toObject(),
      author: author ? {
        username: author.username,
        displayName: author.profile?.displayName,
        avatarUrl: author.profile?.avatarUrl,
      } : null,
    };
  }

  async getComments(postId: string, cursor?: string, limit = 20) {
    const query: any = { postId, parentId: null, isDeleted: false };
    if (cursor) query.createdAt = { $lt: new Date(cursor) };

    const comments = await Comment.find(query).sort({ createdAt: -1 }).limit(limit).lean();

    const userIds = [...new Set(comments.map((c) => c.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const enriched = comments.map((c) => ({
      ...c,
      author: userMap[c.userId] ? {
        username: userMap[c.userId].username,
        displayName: userMap[c.userId].profile?.displayName,
        avatarUrl: userMap[c.userId].profile?.avatarUrl,
      } : null,
    }));

    const nextCursor = comments.length === limit ? comments[comments.length - 1].createdAt.toISOString() : null;
    return { comments: enriched, nextCursor };
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new AppError(404, "Bình luận không tồn tại");
    if (comment.userId !== userId) throw new AppError(403, "Không có quyền xóa");
    comment.isDeleted = true;
    await comment.save();
    await Post.findByIdAndUpdate(comment.postId, { $inc: { "engagement.commentCount": -1 } });
  }

  private async enrichPost(post: any, viewerId?: string, spoilerMap?: Map<string, number>) {
    const author = await prisma.user.findUnique({
      where: { id: post.userId },
      select: { username: true, profile: { select: { displayName: true, avatarUrl: true } } },
    });

    let isBookmarked = false;
    if (viewerId) {
      const bm = await Bookmark.findOne({ userId: viewerId, postId: String(post._id) });
      isBookmarked = !!bm;
    }

    // Check spoiler protection
    let isSpoilerHidden = false;
    if (spoilerMap && post.hasSpoiler && post.tags?.animeIds?.length) {
      for (const animeId of post.tags.animeIds) {
        if (spoilerMap.has(animeId)) {
          isSpoilerHidden = true;
          break;
        }
      }
    }

    return {
      ...post,
      author: author ? {
        username: author.username,
        displayName: author.profile?.displayName,
        avatarUrl: author.profile?.avatarUrl,
      } : null,
      userReaction: null,
      isBookmarked,
      isSpoilerHidden,
    };
  }

  async bookmarkPost(postId: string, userId: string) {
    await Bookmark.findOneAndUpdate(
      { userId, postId },
      { userId, postId },
      { upsert: true }
    );
  }

  async removeBookmark(postId: string, userId: string) {
    await Bookmark.deleteOne({ userId, postId });
  }

  async getBookmarks(userId: string) {
    const bookmarks = await Bookmark.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    const postIds = bookmarks.map((b) => b.postId);
    const posts = await Post.find({ _id: { $in: postIds } }).lean();
    const enriched = await Promise.all(posts.map((p) => this.enrichPost(p, userId)));
    return { posts: enriched };
  }
}
