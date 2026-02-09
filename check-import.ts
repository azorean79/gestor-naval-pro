import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.certificado.count();
  const jangadas = await prisma.jangada.count();
  const navios = await prisma.navio.count();

  console.log('='.repeat(50));
  console.log('RESUMO FINAL DA IMPORTACAO:');
  console.log('='.repeat(50));
  console.log('Certificados criados:', count);
  console.log('Jangadas criadas:', jangadas);
  console.log('Navios criados:', navios);
  console.log('='.repeat(50));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
