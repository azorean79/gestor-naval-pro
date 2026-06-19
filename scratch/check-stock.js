const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  const stock = await prisma.stock.findMany({
    where: {
      OR: [
        { referencia: { in: ['D508', 'D509', 'MK20-FLAT', '10304232', '10304222', '8.03.03.84.0', '8.03.03.85.0'] } },
        { descricao: { contains: 'cinta' } },
        { descricao: { contains: 'Cinta' } },
        { descricao: { contains: 'lashing' } },
        { descricao: { contains: 'strap' } }
      ]
    }
  });
  console.log('Stock items matching straps/lashing/cintas:');
  console.log(JSON.stringify(stock, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
