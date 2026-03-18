import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

import { connectPostgreSQL, connectMongoDB } from "./config/database";
import { checkElasticsearch } from "./config/elasticsearch";
import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middlewares/error.middleware";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Connect Databases
connectPostgreSQL();
connectMongoDB();
checkElasticsearch();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());

// API Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Check Endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Anime Social API Server is running!");
});

// Global Error Handler
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`🚀 [server]: Server is running at http://localhost:${port}`);
  logger.info(`📄 [docs]: Swagger UI is available at http://localhost:${port}/api/docs`);
});
