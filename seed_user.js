const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'julio.correia@orey.com';
  const password = 'cabouco321';
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      role: 'ADMIN'
    },
    create: {
      email,
      name: 'Júlio Correia',
      passwordHash: hash,
      role: 'ADMIN'
    }
  });

  console.log('User created:', user.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
