import { Router } from "express";
import { SocialController } from "./social.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();
const ctrl = new SocialController();

// Follow
router.post("/follow/:userId", authenticate, ctrl.follow.bind(ctrl));
router.delete("/follow/:userId", authenticate, ctrl.unfollow.bind(ctrl));
router.get("/followers/:userId", ctrl.getFollowers.bind(ctrl));
router.get("/following/:userId", ctrl.getFollowing.bind(ctrl));

// Friends
router.post("/friend-request/:userId", authenticate, ctrl.sendFriendRequest.bind(ctrl));
router.put("/friend-request/:requestId", authenticate, ctrl.respondFriendRequest.bind(ctrl));
router.delete("/friends/:userId", authenticate, ctrl.unfriend.bind(ctrl));
router.get("/friends", authenticate, ctrl.getFriends.bind(ctrl));
router.get("/friend-requests", authenticate, ctrl.getPendingRequests.bind(ctrl));

// Suggestions & Match
router.get("/suggestions", authenticate, ctrl.getSuggestions.bind(ctrl));
router.get("/anime-match/:userId", authenticate, ctrl.getAnimeMatch.bind(ctrl));

export default router;
