import { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../config/database";

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError(401, "Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập."));
    }

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return next(new AppError(401, "Người dùng không còn tồn tại."));
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError(401, "Token không hợp lệ hoặc đã hết hạn."));
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Bạn không có quyền thực hiện hành động này."));
    }
    next();
  };
};

export const requireEmailVerified = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user.emailVerified) {
    return next(new AppError(403, "Vui lòng xác minh email để thực hiện hành động này."));
  }
  next();
};

export const requireAdmin = restrictTo("ADMIN");

// Alias for protect
export const authenticate = protect;

// Optional auth - attaches user if token present, but doesn't fail if not
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) return next();

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true, role: true, status: true, emailVerified: true },
    });
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
};
