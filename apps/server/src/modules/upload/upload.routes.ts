import { Router, Request } from "express";
import { protect } from "../../middlewares/auth.middleware";
import { upload, uploadToCloudinary } from "../../utils/upload";
import { AppError } from "../../middlewares/error.middleware";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../../config/database";

// Separate multer for VRM — allow model/gltf-binary + octet-stream, up to 50MB
const vrmUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.originalname.endsWith(".vrm") ||
      file.mimetype === "model/gltf-binary" ||
      file.mimetype === "application/octet-stream";
    if (ok) cb(null, true);
    else cb(new AppError(400, "Chỉ chấp nhận file .vrm") as any, false);
  },
});

interface AuthRequest extends Request {
  user?: any;
}

const router = Router();

// POST /api/v1/upload/image — upload single image
router.post("/image", protect, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, "Không có file được gửi lên");
    const folder = (req.query.folder as string) || "anime-social/general";
    const { url, publicId } = await uploadToCloudinary(req.file.buffer, folder, "image");
    res.json({ success: true, data: { url, publicId } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/upload/avatar — upload avatar
router.post("/avatar", protect, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, "Không có file được gửi lên");
    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      `anime-social/avatars/${(req as AuthRequest).user!.id}`,
      "image"
    );
    res.json({ success: true, data: { url, publicId } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/upload/banner — upload banner
router.post("/banner", protect, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, "Không có file được gửi lên");
    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      `anime-social/banners/${(req as AuthRequest).user!.id}`,
      "image"
    );
    res.json({ success: true, data: { url, publicId } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/upload/media — upload post media (image or video)
router.post("/media", protect, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, "Không có file được gửi lên");
    const isVideo = req.file.mimetype.startsWith("video/");
    const { url, publicId } = await uploadToCloudinary(
      req.file.buffer,
      "anime-social/posts",
      isVideo ? "video" : "image"
    );
    res.json({ success: true, data: { url, publicId, type: isVideo ? "VIDEO" : "IMAGE" } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/upload/vrm — upload VRM avatar file (up to 50MB)
// Stores as raw resource on Cloudinary so the binary is preserved
router.post("/vrm", protect, vrmUpload.single("vrm"), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, "Không có file .vrm được gửi lên");
    const userId = (req as AuthRequest).user!.id;

    let vrmUrl: string;

    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload as raw so Cloudinary doesn't try to process it as image
      const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `anime-social/vrm/${userId}`,
            resource_type: "raw",
            public_id: `avatar_${Date.now()}`,
            format: "vrm",
          },
          (err, result) => {
            if (err || !result) return reject(new AppError(500, "Upload VRM thất bại: " + err?.message));
            resolve(result as any);
          }
        );
        stream.end(req.file!.buffer);
      });
      vrmUrl = result.secure_url;
    } else {
      // Fallback: serve from local public/models (dev only)
      // In production always configure Cloudinary
      throw new AppError(500, "Cloudinary chưa được cấu hình. Vui lòng thêm CLOUDINARY_* vào .env");
    }

    // Save vrmUrl to user's avatar record
    await prisma.avatar.upsert({
      where: { userId },
      create: { userId, vrmUrl },
      update: { vrmUrl },
    });

    res.json({ success: true, data: { vrmUrl } });
  } catch (err) {
    next(err);
  }
});

export default router;
