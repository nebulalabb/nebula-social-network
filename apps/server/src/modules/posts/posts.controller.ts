import { Request, Response, NextFunction } from "express";
import { PostsService } from "./posts.service";
import { Post } from "./post.model";
import { prisma } from "../../config/database";

const postsService = new PostsService();

export class PostsController {
  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await postsService.createPost(req.user!.id, req.body);
      res.status(201).json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  }

  async getExplore(req: Request, res: Response, next: NextFunction) {
    try {
      const { cursor, limit, hashtag, sort } = req.query;
      const query: any = { visibility: "PUBLIC" };
      if (hashtag) query.hashtags = hashtag;
      if (cursor) query.createdAt = { $lt: new Date(cursor as string) };

      const sortOrder = sort === "new"
        ? { createdAt: -1 as const }
        : { "engagement.reactionCount": -1 as const, createdAt: -1 as const };

      const posts = await Post.find(query).sort(sortOrder).limit(Number(limit) || 20).lean();
      const userIds = [...new Set(posts.map((p: any) => p.userId))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds as string[] } },
        select: { id: true, username: true, profile: { select: { displayName: true, avatarUrl: true } } },
      });
      const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
      const enriched = posts.map((p: any) => ({ ...p, author: userMap[p.userId] || null }));
      res.json({ success: true, data: { posts: enriched } });
    } catch (err) { next(err); }
  }

  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const { cursor, limit } = req.query;
      const data = await postsService.getFeed(
        req.user!.id,
        cursor as string,
        limit ? parseInt(limit as string) : 20
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getPost(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await postsService.getPostById(req.params.id, req.user?.id);
      res.json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  }

  async getUserPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { cursor, limit } = req.query;
      const data = await postsService.getUserPosts(
        req.params.userId,
        req.user?.id,
        cursor as string,
        limit ? parseInt(limit as string) : 20
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      await postsService.deletePost(req.params.id, req.user!.id);
      res.json({ success: true, message: "Đã xóa bài đăng" });
    } catch (err) {
      next(err);
    }
  }

  async reactToPost(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await postsService.reactToPost(req.params.id, req.user!.id, req.body.type);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async removeReaction(req: Request, res: Response, next: NextFunction) {
    try {
      await postsService.removeReaction(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const comment = await postsService.addComment(
        req.params.id,
        req.user!.id,
        req.body.content,
        req.body.parentId
      );
      res.status(201).json({ success: true, data: comment });
    } catch (err) {
      next(err);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      await postsService.deleteComment(req.params.commentId, req.user!.id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { cursor, limit } = req.query;
      const data = await postsService.getComments(
        req.params.id,
        cursor as string,
        limit ? parseInt(limit as string) : 20
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async bookmarkPost(req: Request, res: Response, next: NextFunction) {
    try {
      await postsService.bookmarkPost(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  async removeBookmark(req: Request, res: Response, next: NextFunction) {
    try {
      await postsService.removeBookmark(req.params.id, req.user!.id);
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  async getBookmarks(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await postsService.getBookmarks(req.user!.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}
