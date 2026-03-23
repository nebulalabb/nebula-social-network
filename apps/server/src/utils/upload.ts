import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "../middlewares/error.middleware";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage so we can stream to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Chỉ chấp nhận tệp hình ảnh hoặc video!"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * Upload a buffer to Cloudinary and return the secure URL
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "video" | "auto" = "image"
): Promise<{ url: string; publicId: string }> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    // Fallback: return a placeholder if Cloudinary not configured
    throw new AppError(500, "Cloudinary chưa được cấu hình. Vui lòng thêm CLOUDINARY_* vào .env");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) return reject(new AppError(500, "Upload thất bại: " + error?.message));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) return;
  await cloudinary.uploader.destroy(publicId);
}
