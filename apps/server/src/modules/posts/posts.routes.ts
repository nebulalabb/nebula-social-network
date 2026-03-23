import { Router } from "express";
import { PostsController } from "./posts.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const ctrl = new PostsController();

// Feed
router.get("/feed", authenticate, ctrl.getFeed.bind(ctrl));
router.get("/explore", ctrl.getExplore.bind(ctrl));
router.get("/bookmarks", authenticate, ctrl.getBookmarks.bind(ctrl));

// Posts CRUD
router.post("/", authenticate, ctrl.createPost.bind(ctrl));
router.get("/:id", ctrl.getPost.bind(ctrl));
router.delete("/:id", authenticate, ctrl.deletePost.bind(ctrl));

// User posts
router.get("/user/:userId", ctrl.getUserPosts.bind(ctrl));

// Reactions
router.post("/:id/react", authenticate, ctrl.reactToPost.bind(ctrl));
router.delete("/:id/react", authenticate, ctrl.removeReaction.bind(ctrl));

// Bookmarks
router.post("/:id/bookmark", authenticate, ctrl.bookmarkPost.bind(ctrl));
router.delete("/:id/bookmark", authenticate, ctrl.removeBookmark.bind(ctrl));

// Comments
router.get("/:id/comments", ctrl.getComments.bind(ctrl));
router.post("/:id/comments", authenticate, ctrl.addComment.bind(ctrl));
router.delete("/:id/comments/:commentId", authenticate, ctrl.deleteComment.bind(ctrl));

export default router;
