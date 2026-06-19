import prisma from "../src/lib/prisma";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "julio.correia@orey.com" },
    select: { id: true, email: true, name: true, role: true, passwordHash: true, lastLoginAt: true },
  });

  console.log(JSON.stringify(user, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
