import { prisma } from "../../config/database";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const avatarService = {
  async getAvatar(userId: string) {
    return prisma.userAvatar.findUnique({ where: { userId } });
  },

  async upsertAvatar(userId: string, data: {
    vrmUrl?: string;
    thumbnailUrl?: string;
    displayName?: string;
    pose?: string;
    emotion?: string;
    isPublic?: boolean;
  }) {
    return prisma.userAvatar.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },

  async uploadVRM(userId: string, buffer: Buffer, originalName: string): Promise<{ vrmUrl: string }> {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error("Cloudinary chưa được cấu hình");
    }

    // Upload as raw file (VRM is binary)
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `avatars/${userId}`,
          resource_type: "raw",
          public_id: `vrm_${Date.now()}`,
          format: "vrm",
        },
        (err, res) => {
          if (err || !res) return reject(err ?? new Error("Upload failed"));
          resolve(res);
        }
      );
      stream.end(buffer);
    });

    const vrmUrl = result.secure_url;

    // Update DB
    await prisma.userAvatar.upsert({
      where: { userId },
      create: { userId, vrmUrl },
      update: { vrmUrl },
    });

    return { vrmUrl };
  },
};
