import prisma from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, googleId: true },
    take: 20,
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
