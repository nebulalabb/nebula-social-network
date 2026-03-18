import { Request, Response, NextFunction } from "express";
import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  logger.error(`[${req.method}] ${req.path} >> ${statusCode} - ${message}`);

  if (process.env.NODE_ENV === "development") {
    return res.status(statusCode).json({
      status: "error",
      message,
      stack: err.stack,
    });
  }

  return res.status(statusCode).json({
    status: "error",
    message: statusCode === 500 ? "Something went wrong" : message,
  });
};
