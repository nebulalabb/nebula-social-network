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
