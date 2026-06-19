// scripts/seed-inspecoes-2025.ts
// Gera inspeções de exemplo para cada jangada/certificado de 2025
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  // Carregar certificados 2025
  const certificados = JSON.parse(fs.readFileSync('certificados-orey-2025-final.json', 'utf8'));
  let count = 0;

  for (const cert of certificados) {
    const numeroSerie = cert.numeroSerie || cert.serie;
    if (!numeroSerie) continue;

    // Procurar jangada correspondente
    const jangada = await prisma.jangada.findFirst({ where: { numeroSerie } });
    if (!jangada) continue;

    // Criar inspeção de exemplo
    await prisma.inspecao.create({
      data: {
        jangadaId: jangada.id,
        certificadoNumero: cert.certificadoNumero || cert.numero_certificado || cert.fileName,
        dataInspecao: cert.dataInspecao ? new Date(cert.dataInspecao) : new Date('2025-01-01'),
        dataProxInspecao: cert.dataProxInspecao ? new Date(cert.dataProxInspecao) : new Date('2026-01-01'),
        status: 'concluida',
        observacoes: 'Inspeção gerada automaticamente para seed.',
        notas: cert.notas || null,
        resultado: 'Aprovada',
        artigos: Array.isArray(cert.validities) ? cert.validities.map(v => ({
          name: v.item,
          validade: v.validade,
          quantidade: 1,
          referencia: v.referencia || ''
        })) : [],
        sourceFile: cert.fileName || null,
      }
    });
    count++;
  }
  console.log(`Seed concluído: ${count} inspeções criadas.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
