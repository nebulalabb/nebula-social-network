import "dotenv/config";
import express, { Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import http from "http";

import { connectPostgreSQL, connectMongoDB } from "./config/database";
import { checkElasticsearch } from "./config/elasticsearch";
import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middlewares/error.middleware";
import { logger } from "./utils/logger";
import { initSocket } from "./socket";
import "./queue/email.worker";

import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import postsRoutes from "./modules/posts/posts.routes";
import animeRoutes from "./modules/anime/anime.routes";
import mangaRoutes from "./modules/manga/manga.routes";
import socialRoutes from "./modules/social/social.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import chatRoutes from "./modules/chat/chat.routes";
import gamificationRoutes from "./modules/gamification/gamification.routes";
import clubsRoutes from "./modules/clubs/clubs.routes";
import reviewsRoutes from "./modules/reviews/reviews.routes";
import scheduleRoutes from "./modules/schedule/schedule.routes";
import newsRoutes from "./modules/news/news.routes";
import eventsRoutes from "./modules/events/events.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import roomRoutes from "./modules/room/room.routes";
import avatarRoutes from "./modules/avatar/avatar.routes";
import livekitRoutes from "./modules/livekit/livekit.routes";
import fanContentRoutes from "./modules/fanContent/fanContent.routes";
import searchRoutes from "./modules/search/search.routes";
import premiumRoutes from "./modules/premium/premium.routes";
import shopRoutes from "./modules/shop/shop.routes";

const app = express();
const port = process.env.PORT || 4000;

// Connect Databases
connectPostgreSQL();
connectMongoDB();
checkElasticsearch();

// ── CORS config — shared between middleware and preflight handler ──────────────
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    // Dev: allow all localhost ports
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    const allowed = (process.env.FRONTEND_URL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (allowed.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
};

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút",
});

// ── Middlewares ───────────────────────────────────────────────────────────────
// OPTIONS preflight MUST be handled before any other middleware
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
app.use(limiter);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan("dev"));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── API Docs ──────────────────────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/posts", postsRoutes);
app.use("/api/v1/anime", animeRoutes);
app.use("/api/v1/manga", mangaRoutes);
app.use("/api/v1/social", socialRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/conversations", chatRoutes);
app.use("/api/v1/gamification", gamificationRoutes);
app.use("/api/v1/clubs", clubsRoutes);
app.use("/api/v1/reviews", reviewsRoutes);
app.use("/api/v1/schedule", scheduleRoutes);
app.use("/api/v1/news", newsRoutes);
app.use("/api/v1/events", eventsRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/avatars", avatarRoutes);
app.use("/api/v1/livekit", livekitRoutes);
app.use("/api/v1", fanContentRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/premium", premiumRoutes);
app.use("/api/v1/shop", shopRoutes);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get("/", (_req: Request, res: Response) => {
  res.send("Anime Social API Server is running!");
});

app.use(errorHandler);

// ── Server ────────────────────────────────────────────────────────────────────
const server = http.createServer(app);
initSocket(server);

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    logger.error(`Port ${port} is in use, retrying in 3s...`);
    setTimeout(() => server.listen(port), 3000);
  } else {
    logger.error(String(err));
    process.exit(1);
  }
});

server.listen(port, () => {
  logger.info(`🚀 Server running at http://localhost:${port}`);
  logger.info(`📄 Swagger UI at http://localhost:${port}/api/docs`);
});

process.on("unhandledRejection", (reason) => logger.error("Unhandled Rejection: " + String(reason)));
process.on("uncaughtException", (err) => logger.error("Uncaught Exception: " + String(err)));
