import { config } from "dotenv";
import path from "path";
import { defineConfig } from "prisma/config";

// Load .env from project root
config({ path: path.join(__dirname, "../../.env") });

export default defineConfig({
  schema: path.join(__dirname, "prisma/schema.prisma"),
  migrations: {
    path: path.join(__dirname, "prisma/migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
