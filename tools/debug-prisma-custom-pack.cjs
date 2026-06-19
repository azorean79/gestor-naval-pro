const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log(JSON.stringify({
      hasCustomPackType: !!prisma.customPackType,
      packKeys: Object.keys(prisma).filter((key) => key.toLowerCase().includes('pack')),
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
