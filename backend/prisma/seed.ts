import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add seed data here
  // Example:
  // await prisma.user.create({
  //   data: {
  //     id: 'example-id',
  //     knowledgePoints: 0,
  //     knowledgeLevel: 'A1',
  //   },
  // });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
