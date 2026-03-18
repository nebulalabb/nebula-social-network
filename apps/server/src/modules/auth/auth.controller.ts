import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { AppError } from "../../middlewares/error.middleware";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schema";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await authService.register(validatedData);

      res.status(201).json({
        status: "success",
        message: "Verification email sent",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);

      if ((result as any).twoFactorRequired) {
        return res.status(200).json({
          status: "success",
          data: {
            twoFactorRequired: true,
            userId: (result as any).userId,
          },
        });
      }

      const { user, accessToken, refreshToken } = result as any;

      // Set cookie for refresh token - 30 days as requested (30 * 24 * 60 * 60 * 1000)
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: "success",
        accessToken,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async validate2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, token } = req.body;
      const { user, accessToken, refreshToken } = await authService.validate2FALogin(userId, token);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: "success",
        accessToken,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response) {
    res.clearCookie("refreshToken");
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      await authService.forgotPassword(validatedData);

      res.status(200).json({
        status: "success",
        message: "Link reset mật khẩu đã được gửi đến email của bạn",
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(validatedData);

      res.status(200).json({
        status: "success",
        message: "Mật khẩu đã được đặt lại thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { otp, userId } = req.body;
      await authService.verifyEmail(userId, otp);

      res.status(200).json({
        status: "success",
        message: "Xác minh email thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const oldRefreshToken = req.cookies.refreshToken;
      if (!oldRefreshToken) throw new AppError(401, "No refresh token provided");

      const { accessToken, refreshToken } = await authService.refreshToken(oldRefreshToken);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: "success",
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const sessions = await authService.getSessions((req as any).user.id);
      res.status(200).json({
        status: "success",
        data: { sessions },
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      await authService.revokeSession((req as any).user.id, sessionId);
      res.status(200).json({
        status: "success",
        message: "Phiên đăng nhập đã bị hủy",
      });
    } catch (error) {
      next(error);
    }
  }

  async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const { secret, qrCodeUrl } = await authService.setup2FA((req as any).user.id);
      res.status(200).json({
        status: "success",
        data: { secret, qrCodeUrl },
      });
    } catch (error) {
      next(error);
    }
  }

  async verify2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, secret } = req.body;
      await authService.verify2FA((req as any).user.id, token, secret);
      res.status(200).json({
        status: "success",
        message: "2FA đã được kích hoạt thành công",
      });
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await authService.resendVerification(email);
      res.status(200).json({
        status: "success",
        message: "Mã xác minh đã được gửi lại",
      });
    } catch (error) {
      next(error);
    }
  }

  async revokeAllSessions(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.revokeAllSessions((req as any).user.id);
      res.status(200).json({
        status: "success",
        message: "Đã đăng xuất khỏi tất cả thiết bị",
      });
    } catch (error) {
      next(error);
    }
  }

  async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.disable2FA((req as any).user.id);
      res.status(200).json({
        status: "success",
        message: "2FA đã được tắt",
      });
    } catch (error) {
      next(error);
    }
  }
}
