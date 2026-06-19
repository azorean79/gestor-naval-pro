import bcrypt from "bcryptjs";
import prisma from "../src/lib/prisma";

const email = process.argv[2] || "julio.correia@orey.com";
const newPassword = process.argv[3] || "Orey2026!";

async function main() {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash },
    select: { id: true, email: true, name: true },
  });
  console.log(`Password reset for ${user.email} (id=${user.id}). New password: ${newPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
