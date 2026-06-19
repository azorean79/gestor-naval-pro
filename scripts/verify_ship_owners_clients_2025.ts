import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

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
  const reportPath = path.join(process.cwd(), 'scripts', 'import_ship_owners_from_json_2025_report.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as { createdSample?: string[]; ownersUnique?: number };
  const targets = Array.isArray(report.createdSample) ? report.createdSample : [];

  const found = await prisma.cliente.findMany({
    where: { nome: { in: targets } },
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  });

  const totalClientes = await prisma.cliente.count();

  console.log(`Total de clientes na base: ${totalClientes}`);
  console.log(`Owners únicos no relatório: ${report.ownersUnique ?? 'N/D'}`);
  console.log(`Amostra de owners verificados encontrados: ${found.length}/${targets.length}`);
  for (const c of found) {
    console.log(`- ${c.id}: ${c.nome}`);
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
