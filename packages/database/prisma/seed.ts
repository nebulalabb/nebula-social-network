import * as dotenv from "dotenv";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Must set env BEFORE using PrismaClient
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is not set");

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Seed Badges
  await prisma.badge.upsert({
    where: { name: "Anime Lover" },
    update: {},
    create: { name: "Anime Lover", description: "Xem xong 10 bộ anime đầu tiên" },
  });

  await prisma.badge.upsert({
    where: { name: "King of Manga" },
    update: {},
    create: { name: "King of Manga", description: "Đọc xong 1000 chapter manga" },
  });

  await prisma.badge.upsert({
    where: { name: "Social Butterfly" },
    update: {},
    create: { name: "Social Butterfly", description: "Có 50 bạn bè trên hệ thống" },
  });

  // Seed Achievements
  await prisma.achievement.upsert({
    where: { name: "First Post" },
    update: {},
    create: { name: "First Post", description: "Đăng bài viết đầu tiên", expReward: 100 },
  });

  await prisma.achievement.upsert({
    where: { name: "Anime Completionist" },
    update: {},
    create: { name: "Anime Completionist", description: "Hoàn thành 50 bộ anime", expReward: 500 },
  });

  await prisma.achievement.upsert({
    where: { name: "Manga Reader" },
    update: {},
    create: { name: "Manga Reader", description: "Đọc 100 chapter manga", expReward: 200 },
  });

  // Seed Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@animesocial.com" },
    update: {},
    create: {
      email: "admin@animesocial.com",
      username: "admin",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: true,
      profile: {
        create: { displayName: "System Admin", bio: "Tôi là quản trị viên hệ thống." },
      },
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: "user@animesocial.com" },
    update: {},
    create: {
      email: "user@animesocial.com",
      username: "animefan",
      password: userPassword,
      role: "USER",
      emailVerified: true,
      profile: {
        create: { displayName: "Anime Fan #1", bio: "Một fan cuồng anime chính hiệu." },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "user2@animesocial.com" },
    update: {},
    create: {
      email: "user2@animesocial.com",
      username: "mangalover",
      password: userPassword,
      role: "USER",
      emailVerified: true,
      profile: {
        create: { displayName: "Manga Lover", bio: "Đọc manga mỗi ngày." },
      },
    },
  });

  // Seed Anime Entries
  await prisma.animeEntry.upsert({
    where: { malId: 20 },
    update: {},
    create: {
      malId: 20,
      titleEn: "Naruto",
      titleJp: "ナルト",
      synopsis: "Naruto Uzumaki, a mischievous adolescent ninja, struggles as he searches for recognition.",
      type: "TV",
      episodes: 220,
      status: "Finished Airing",
      score: 7.9,
      genres: ["Action", "Adventure", "Fantasy"],
      studios: ["Studio Pierrot"],
    },
  });

  await prisma.animeEntry.upsert({
    where: { malId: 21 },
    update: {},
    create: {
      malId: 21,
      titleEn: "One Piece",
      titleJp: "ワンピース",
      synopsis: "Gol D. Roger was known as the 'Pirate King'.",
      type: "TV",
      status: "Currently Airing",
      score: 8.7,
      genres: ["Action", "Adventure", "Fantasy"],
      studios: ["Toei Animation"],
    },
  });

  await prisma.animeEntry.upsert({
    where: { malId: 5114 },
    update: {},
    create: {
      malId: 5114,
      titleEn: "Fullmetal Alchemist: Brotherhood",
      titleJp: "鋼の錬金術師 BROTHERHOOD",
      synopsis: "Two brothers search for a Philosopher's Stone after an attempt to revive their deceased mother goes wrong.",
      type: "TV",
      episodes: 64,
      status: "Finished Airing",
      score: 9.1,
      genres: ["Action", "Adventure", "Drama", "Fantasy"],
      studios: ["Bones"],
    },
  });

  await prisma.animeEntry.upsert({
    where: { malId: 1535 },
    update: {},
    create: {
      malId: 1535,
      titleEn: "Death Note",
      titleJp: "デスノート",
      synopsis: "A high school student discovers a supernatural notebook that allows him to kill anyone.",
      type: "TV",
      episodes: 37,
      status: "Finished Airing",
      score: 8.6,
      genres: ["Mystery", "Psychological", "Supernatural", "Thriller"],
      studios: ["Madhouse"],
    },
  });

  // Seed Manga Entries
  await prisma.mangaEntry.upsert({
    where: { malId: 2 },
    update: {},
    create: {
      malId: 2,
      titleEn: "Berserk",
      titleJp: "ベルセルク",
      synopsis: "Guts, a former mercenary now known as the 'Black Swordsman'.",
      chapters: 380,
      status: "On Hiatus",
      score: 9.4,
      genres: ["Action", "Adventure", "Drama", "Fantasy", "Horror", "Seinen"],
      authors: ["Kentaro Miura"],
    },
  });

  await prisma.mangaEntry.upsert({
    where: { malId: 13 },
    update: {},
    create: {
      malId: 13,
      titleEn: "One Piece",
      titleJp: "ワンピース",
      synopsis: "As a child, Monkey D. Luffy was inspired by Red-Haired Shanks to become a great pirate.",
      status: "Publishing",
      score: 9.2,
      genres: ["Action", "Adventure", "Fantasy", "Shounen"],
      authors: ["Eiichiro Oda"],
    },
  });

  // Seed anime list entries for normalUser
  const naruto = await prisma.animeEntry.findUnique({ where: { malId: 20 } });
  const fmab = await prisma.animeEntry.findUnique({ where: { malId: 5114 } });

  if (naruto) {
    await prisma.animeList.upsert({
      where: { userId_animeId: { userId: normalUser.id, animeId: naruto.id } },
      update: {},
      create: { userId: normalUser.id, animeId: naruto.id, status: "COMPLETED", score: 8, progress: 220 },
    });
  }

  if (fmab) {
    await prisma.animeList.upsert({
      where: { userId_animeId: { userId: normalUser.id, animeId: fmab.id } },
      update: {},
      create: { userId: normalUser.id, animeId: fmab.id, status: "COMPLETED", score: 10, progress: 64 },
    });
  }

  console.log("✅ Seeding completed.");
  console.log("   Admin: admin@animesocial.com / admin123");
  console.log("   User:  user@animesocial.com / user123");
  console.log("   User2: user2@animesocial.com / user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
