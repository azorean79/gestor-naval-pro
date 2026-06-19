// scripts/seed-inspecoes-2025-limpo.ts
// Limpa todas as inspeções e faz seed de 1 inspeção por jangada/certificado 2025
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  // 1. Limpar todas as inspeções existentes
  await prisma.inspecao.deleteMany({});
  console.log('Todas as inspeções antigas foram removidas.');

  // 2. Carregar certificados 2025
  const certificados = JSON.parse(fs.readFileSync('certificados-orey-2025-final.json', 'utf8'));
  let count = 0;

  for (const cert of certificados) {
    const numeroSerie = cert.numeroSerie || cert.serie;
    if (!numeroSerie) continue;

    // Procurar jangada correspondente (ajuste o campo se necessário)
    const jangada = await prisma.jangada.findFirst({ where: { serial: numeroSerie } });
    if (!jangada) continue;

    // Garantir datas como string ISO
    const dataInspecao = cert.dataInspecao ? new Date(cert.dataInspecao).toISOString() : new Date('2025-01-01').toISOString();
    const dataProxInspecao = cert.dataProxInspecao ? new Date(cert.dataProxInspecao).toISOString() : new Date('2026-01-01').toISOString();

    // Criar inspeção única para esta jangada
    await prisma.inspecao.create({
      data: {
        jangadaId: jangada.id,
        jangadaSerial: numeroSerie,
        certificadoNumero: cert.certificadoNumero || cert.numero_certificado || cert.fileName,
        dataInspecao,
        dataProxInspecao,
        status: 'Concluída',
        sourceFile: cert.fileName || null,
        navioNome: cert.navio_nome || '',
        navioId: null,
      }
    });
    count++;
  }
  console.log(`Seed concluído: ${count} inspeções criadas (1 por jangada/certificado 2025).`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
