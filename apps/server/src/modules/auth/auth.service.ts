import bcrypt from "bcryptjs";
import { prisma } from "../../config/database";
import { redis } from "../../config/redis";
import { AppError } from "../../middlewares/error.middleware";
import { logger } from "../../utils/logger";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { notificationQueue, addJob } from "../../queue";
import { SessionService } from "./session.service";
import { TFAService } from "./tfa.service";
import { RegisterInput, LoginInput } from "./auth.schema";

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existingUser) {
      throw new AppError(400, "Email hoặc Username đã tồn tại");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        profile: {
          create: {
            displayName: data.username,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    // Generate Verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(`otp:verify:${user.id}`, otp, "EX", 10 * 60);

    // Send Email
    await addJob(notificationQueue, "sendOTP", {
      email: user.email,
      otp,
    });

    return user;
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { profile: true },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new AppError(401, "Email hoặc mật khẩu không chính xác");
    }

    if (!user.emailVerified && process.env.NODE_ENV === "production") {
      throw new AppError(401, "Vui lòng xác minh email trước khi đăng nhập");
    }

    if (user.twoFactorEnabled) {
      return { 
        twoFactorRequired: true, 
        userId: user.id 
      };
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      const decoded = verifyRefreshToken(oldRefreshToken);
      
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) throw new AppError(401, "Người dùng không tồn tại");

      const accessToken = generateAccessToken(user.id);
      const newRefreshToken = generateRefreshToken(user.id);

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new AppError(401, "Refresh token không hợp lệ hoặc đã hết hạn");
    }
  }

  async forgotPassword(data: { email: string }) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new AppError(404, "Không tìm thấy người dùng với email này");
    }

    const resetToken = (await import("crypto")).randomUUID();
    
    // Store token in Redis with 1 hour expiry per requirement
    await redis.set(`reset:${resetToken}`, user.id, "EX", 60 * 60);
    
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // Add job to BullMQ queue
    await addJob(notificationQueue, "sendResetLink", {
      email: data.email,
      link: resetLink,
    });
    
    return resetToken;
  }

  async resetPassword(data: { token: string; newPassword: string }) {
    const userId = await redis.get(`reset:${data.token}`);
    
    if (!userId) {
      throw new AppError(400, "Mã xác thực không hợp lệ hoặc đã hết hạn");
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all sessions on password reset
    await SessionService.revokeAllSessions(userId);

    // Delete token after use
    await redis.del(`reset:${data.token}`);
    
    return true;
  }

  async verifyEmail(userId: string, otp: string) {
    const storedOtp = await redis.get(`otp:verify:${userId}`);
    
    if (!storedOtp || storedOtp !== otp) {
      throw new AppError(400, "Mã OTP không hợp lệ hoặc đã hết hạn");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    await redis.del(`otp:verify:${userId}`);
    return true;
  }

  async getSessions(userId: string) {
    return SessionService.getSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string) {
    return SessionService.revokeSession(userId, sessionId);
  }

  async setup2FA(userId: string) {
    return TFAService.setup(userId);
  }

  async verify2FA(userId: string, token: string, secret: string) {
    return TFAService.verify(userId, token, secret);
  }

  async validate2FALogin(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new AppError(401, "Xác thực không hợp lệ");
    }

    const isValid = TFAService.validate(user.twoFactorSecret, token);
    if (!isValid) {
      throw new AppError(401, "Mã 2FA không chính xác");
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return { user, accessToken, refreshToken };
  }

  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError(404, "Không tìm thấy người dùng");
    if (user.emailVerified) throw new AppError(400, "Email đã được xác minh");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.set(`otp:verify:${user.id}`, otp, "EX", 10 * 60);
    await addJob(notificationQueue, "sendOTP", { email, otp });

    return true;
  }

  async revokeAllSessions(userId: string) {
    return SessionService.revokeAllSessions(userId);
  }

  async disable2FA(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    return true;
  }
}
