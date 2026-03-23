import { Router } from "express";
import passport from "passport";
import { AuthController } from "./auth.controller";
import { protect } from "../../middlewares/auth.middleware";
import "./passport";

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Auth]
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     tags: [Auth]
 */
router.post("/reset-password", authController.resetPassword);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/refresh", authController.refreshToken);

// Dev-only: lấy OTP từ Redis để test (không dùng trong production)
if (process.env.NODE_ENV !== "production") {
  router.get("/dev/otp/:userId", async (req, res) => {
    const { redis } = await import("../../config/redis");
    const otp = await redis.get(`otp:verify:${req.params.userId}`);
    res.json({ otp: otp || null });
  });
}

// Protected routes
router.get("/sessions", protect, authController.getSessions);
router.delete("/sessions/:sessionId", protect, authController.revokeSession);
router.delete("/sessions", protect, authController.revokeAllSessions);

router.post("/2fa/setup", protect, authController.setup2FA);
router.post("/2fa/verify", protect, authController.verify2FA);
router.delete("/2fa/disable", protect, authController.disable2FA);
router.post("/2fa/validate", authController.validate2FA);

import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";

// OAuth2 routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const user = req.user as any;
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  }
);

router.get("/discord", passport.authenticate("discord"));
router.get(
  "/discord/callback",
  passport.authenticate("discord", { session: false }),
  (req, res) => {
    const user = req.user as any;
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  }
);

router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  (req, res) => {
    const user = req.user as any;
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  }
);

export default router;
