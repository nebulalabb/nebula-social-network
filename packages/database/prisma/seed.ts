import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Seed Badges
  await prisma.badge.upsert({
    where: { name: "Anime Lover" },
    update: {},
    create: {
      name: "Anime Lover",
      description: "Xem xong 10 bộ anime đầu tiên",
    },
  });

  await prisma.badge.upsert({
    where: { name: "King of Manga" },
    update: {},
    create: {
      name: "King of Manga",
      description: "Đọc xong 1000 chapter manga",
    },
  });

  // Seed Achievements
  await prisma.achievement.upsert({
    where: { name: "First Post" },
    update: {},
    create: {
      name: "First Post",
      description: "Đăng bài viết đầu tiên trên hệ thống",
      expReward: 100,
    },
  });

  // Seed Users
  const adminPassword = await (await import("bcryptjs")).default.hash("admin123", 10);
  const userPassword = await (await import("bcryptjs")).default.hash("user123", 10);

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
        create: {
          displayName: "System Admin",
          bio: "Tôi là quản trị viên hệ thống.",
        },
      },
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: "user@animesocial.com" },
    update: {},
    create: {
      email: "user@animesocial.com",
      username: "user",
      password: userPassword,
      role: "USER",
      emailVerified: true,
      profile: {
        create: {
          displayName: "Anime Fan #1",
          bio: "Một fan cuồng anime chính hiệu.",
        },
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
      synopsis: "Naruto Uzumaki, a mischievous adolescent ninja...",
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
      synopsis: "Gol D. Roger was known as the 'Pirate King'...",
      type: "TV",
      status: "Currently Airing",
      score: 8.7,
      genres: ["Action", "Adventure", "Fantasy"],
      studios: ["Toei Animation"],
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
      synopsis: "Guts, a former mercenary now known as the 'Black Swordsman'...",
      chapters: 380,
      status: "On Hiatus",
      score: 9.4,
      genres: ["Action", "Adventure", "Demons", "Drama", "Fantasy", "Horror", "Military", "Seinen", "Supernatural"],
      authors: ["Kentaro Miura"],
    },
  });

  console.log("✅ Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
