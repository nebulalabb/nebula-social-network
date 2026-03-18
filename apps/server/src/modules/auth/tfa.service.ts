import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { prisma } from "../../config/database";
import { AppError } from "../../middlewares/error.middleware";

export class TFAService {
  static async setup(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `AnimeSocial:${userId}`,
    });

    // Save temporary secret to user (need to update schema first or store in Redis)
    // For now, let's assume we store it in a temporary field in User model or Redis
    // To keep it simple, let's update User model in Prisma later.
    
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
    };
  }

  static async verify(userId: string, token: string, secret: string) {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
    });

    if (!verified) {
      throw new AppError(400, "Mã xác thực 2FA không hợp lệ");
    }

    // Enable 2FA for user in DB
    await prisma.user.update({
      where: { id: userId },
      data: { 
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });

    return true;
  }

  static validate(secret: string, token: string) {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
    });
  }
}
