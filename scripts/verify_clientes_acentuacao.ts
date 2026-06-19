import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const connectionString =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  process.env.gestornavalpro_DATABASE_URL ??
  process.env.GESTOR_DB;

if (!connectionString) {
  console.error('No database connection string found.');
  process.exit(1);
}

process.env.DATABASE_URL = connectionString;
const prisma = new PrismaClient();

async function main() {
  const broken = await prisma.cliente.findMany({
    where: {
      OR: [
        { nome: { contains: '├' } },
        { nome: { contains: '�' } },
        { nome: { contains: 'Â' } },
      ],
    },
    select: { id: true, nome: true },
    orderBy: { id: 'asc' },
  });

  console.log(`Clientes com possível mojibake restantes: ${broken.length}`);
  for (const c of broken) {
    console.log(`- [${c.id}] ${c.nome}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
