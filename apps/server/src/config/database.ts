import { PrismaClient } from "@prisma/client";
import mongoose from "mongoose";
import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

// Prisma for PostgreSQL
export const prisma = new PrismaClient();

// Mongoose for MongoDB
export const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/anime_social";
    await mongoose.connect(mongoUri);
    logger.info("🍃 Connected to MongoDB");
  } catch (error) {
    logger.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// PostgreSQL check
export const connectPostgreSQL = async () => {
  try {
    await prisma.$connect();
    logger.info("🐘 Connected to PostgreSQL via Prisma");
  } catch (error) {
    logger.error("❌ PostgreSQL connection error:", error);
    process.exit(1);
  }
};
