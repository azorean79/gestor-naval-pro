#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { extrairPortoDeMatricula } from '../src/utils/portosRegisto';
import { inferAzoresIslandFromPort, isInvalidIslandValue } from '../src/lib/azores-islands';

const prisma = new PrismaClient();

type Candidate = {
  id: number;
  nome: string;
  matricula: string | null;
  portoRegisto: string | null;
  ilhaAtual: string | null;
  portoInferido: string | null;
  ilhaNova: string;
  origem: string;
};

async function main() {
  const dryRun = !process.argv.includes('--apply');

  console.log(`\n🧭 BACKFILL ILHA NAVIOS SEM CLIENTE ← MATRÍCULA/PORTO\n`);
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'}\n`);

  const navios = await prisma.$queryRaw<Array<{
    id: number;
    nome: string;
    matricula: string | null;
    portoRegisto: string | null;
    ilha: string | null;
  }>>`
    SELECT "id", "nome", "matricula", "portoRegisto", "ilha"
    FROM "Navio"
    WHERE "clienteId" IS NULL
      AND (
        "ilha" IS NULL
        OR TRIM("ilha") = ''
        OR "ilha" IN ('N/A', 'N/D', 'N D', 'Desconhecida')
      )
    ORDER BY "nome" ASC
  `;

  const candidates: Candidate[] = [];
  const unresolved: Array<{ id: number; nome: string; matricula: string | null; portoRegisto: string | null; ilhaAtual: string | null }> = [];

  for (const navio of navios) {
    if (!isInvalidIslandValue(navio.ilha)) continue;

    const portoInferido = extrairPortoDeMatricula(navio.matricula || undefined);
    const ilhaPorPortoRegisto = inferAzoresIslandFromPort(navio.portoRegisto);
    const ilhaPorMatricula = inferAzoresIslandFromPort(portoInferido);

    let ilhaNova: string | null = null;
    let origem = '';

    if (ilhaPorPortoRegisto && ilhaPorMatricula) {
      if (ilhaPorPortoRegisto === ilhaPorMatricula) {
        ilhaNova = ilhaPorPortoRegisto;
        origem = 'portoRegisto + matrícula';
      }
    } else if (ilhaPorPortoRegisto) {
      ilhaNova = ilhaPorPortoRegisto;
      origem = 'portoRegisto';
    } else if (ilhaPorMatricula) {
      ilhaNova = ilhaPorMatricula;
      origem = 'matrícula';
    }

    if (!ilhaNova) {
      unresolved.push({
        id: navio.id,
        nome: navio.nome,
        matricula: navio.matricula,
        portoRegisto: navio.portoRegisto,
        ilhaAtual: navio.ilha,
      });
      continue;
    }

    candidates.push({
      id: navio.id,
      nome: navio.nome,
      matricula: navio.matricula,
      portoRegisto: navio.portoRegisto,
      ilhaAtual: navio.ilha,
      portoInferido,
      ilhaNova,
      origem,
    });
  }

  console.log('─────────────────────────────────────────────────────────────');
  for (const item of candidates) {
    console.log(`✦ [ID ${item.id}] ${item.nome} → ${item.ilhaNova} [${item.origem}]`);
    console.log(`    matrícula: ${item.matricula || '—'} | portoRegisto: ${item.portoRegisto || '—'} | portoInferido: ${item.portoInferido || '—'}`);
  }

  if (candidates.length === 0) {
    console.log('✅ Nenhum navio sem cliente com inferência segura disponível.');
  }

  if (unresolved.length > 0) {
    console.log('\n── Casos sem inferência segura ─────────────────────────────');
    for (const item of unresolved) {
      console.log(`✗ [ID ${item.id}] ${item.nome} | matrícula: ${item.matricula || '—'} | portoRegisto: ${item.portoRegisto || '—'} | ilha atual: ${item.ilhaAtual || '—'}`);
    }
  }

  if (!dryRun) {
    for (const item of candidates) {
      await prisma.$executeRaw`UPDATE "Navio" SET "ilha" = ${item.ilhaNova} WHERE "id" = ${item.id}`;
    }
  }

  console.log('\n=============================================================');
  console.log(`Navios sem cliente analisados: ${navios.length}`);
  console.log(`Navios com inferência segura ${dryRun ? 'planeada' : 'aplicada'}: ${candidates.length}`);
  console.log(`Navios ainda sem resolução automática: ${unresolved.length}`);
  if (dryRun) {
    console.log('\n⚠️  DRY-RUN — nenhum dado foi alterado.');
    console.log('   Para aplicar, corre com --apply');
  }
  console.log('=============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });