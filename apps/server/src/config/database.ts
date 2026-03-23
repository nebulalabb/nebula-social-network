import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import mongoose from "mongoose";
import pino from "pino";
import dotenv from "dotenv";
import path from "path";

// Load .env explicitly from monorepo root (4 levels up from this file)
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: { colorize: true },
  },
});

// Pool created after dotenv loaded
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

// Mongoose for MongoDB
export const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/anime_social";
    await mongoose.connect(mongoUri);
    logger.info("🍃 Connected to MongoDB");
  } catch (error) {
    logger.error("❌ MongoDB connection error:", error);
    // Don't exit — server can still serve non-MongoDB routes
  }
};

// PostgreSQL check
export const connectPostgreSQL = async () => {
  try {
    await prisma.$connect();
    logger.info("🐘 Connected to PostgreSQL via Prisma");
  } catch (error) {
    logger.error("❌ PostgreSQL connection error:", error);
    // Don't exit — let server start, requests will fail gracefully
  }
};
