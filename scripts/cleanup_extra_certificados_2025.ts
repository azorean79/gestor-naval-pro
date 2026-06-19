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

type CertRow = { file?: string };
type CertRowsFile = { rows?: CertRow[] };

function readJsonWithEncodingFallback(filePath: string): unknown {
  const rawBuffer = fs.readFileSync(filePath);
  let rawUtf8 = rawBuffer.toString('utf8');
  if (rawUtf8.charCodeAt(0) === 0xfeff) rawUtf8 = rawUtf8.slice(1);

  try {
    return JSON.parse(rawUtf8);
  } catch {
    const rawUtf16 = rawBuffer.toString('utf16le').replace(/^\uFEFF/, '');
    return JSON.parse(rawUtf16);
  }
}

async function main() {
  const certRowsPath = path.join(process.cwd(), 'scripts', 'jangadas_navios_associadas_2025.json');
  const certRowsJson = readJsonWithEncodingFallback(certRowsPath) as CertRowsFile;
  const allowedFiles = new Set((certRowsJson.rows ?? []).map((r) => (r.file ?? '').trim()).filter(Boolean));

  const all2025 = await prisma.certificadoExtraido.findMany({
    where: { sourceYear: 2025 },
    select: { id: true, fileName: true },
  });

  const extraIds = all2025.filter((c) => !allowedFiles.has(c.fileName)).map((c) => c.id);
  const extraNames = all2025.filter((c) => !allowedFiles.has(c.fileName)).map((c) => c.fileName);

  if (extraIds.length) {
    await prisma.certificadoValidade.deleteMany({ where: { certificadoId: { in: extraIds } } });
    await prisma.certificadoExtraido.deleteMany({ where: { id: { in: extraIds } } });
  }

  const finalCount = await prisma.certificadoExtraido.count({ where: { sourceYear: 2025 } });

  console.log(`Ficheiros permitidos (lista 208): ${allowedFiles.size}`);
  console.log(`Registos extra removidos: ${extraIds.length}`);
  if (extraNames.length) {
    console.log('Extras removidos:');
    for (const n of extraNames) console.log(`- ${n}`);
  }
  console.log(`Contagem final sourceYear=2025: ${finalCount}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
