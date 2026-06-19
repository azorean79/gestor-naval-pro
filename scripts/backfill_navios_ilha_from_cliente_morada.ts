#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { resolveClienteIslandForNavio, normalizeManualNavioIsland } from '../src/lib/navio-island-resolution';

const prisma = new PrismaClient();

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = !process.argv.includes('--apply');

  console.log(`\n🗺️  BACKFILL ILHA NAVIOS ← CLIENTE (ilha + morada)\n`);
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'}\n`);

  const clientes = await prisma.cliente.findMany({
    select: { id: true, nome: true, ilha: true, morada: true, localidade: true, codigoPostal: true },
    orderBy: { nome: 'asc' },
  });

  let clientesAtualizados = 0;
  let naviosAtualizados = 0;
  let naviosSemIlha = 0;

  const log: Array<{ cliente: string; ilhaCliente: string; ilhaFonte: string; naviosAtualizados: string[] }> = [];

  for (const c of clientes) {
    const ilhaAtualCliente = normalizeManualNavioIsland(c.ilha);
    const ilhaCliente = resolveClienteIslandForNavio(c);
    const fonte = ilhaAtualCliente ? 'campo ilha/mapeamento canónico' : 'morada/localidade/código postal';

    if (!ilhaCliente) continue;

    if (ilhaAtualCliente !== ilhaCliente) {
      if (!dryRun) {
        await prisma.cliente.update({ where: { id: c.id }, data: { ilha: ilhaCliente } });
      }
      clientesAtualizados++;
    }

    const navios = await prisma.navio.findMany({
      where: {
        clienteId: c.id,
      },
      select: { id: true, nome: true, matricula: true, ilha: true },
    });

    const nomesNavios: string[] = [];

    for (const n of navios) {
      const ilhaAtualNavio = normalizeManualNavioIsland(n.ilha);
      if (ilhaAtualNavio === ilhaCliente) continue;

      if (!dryRun) {
        await prisma.$executeRaw`UPDATE "Navio" SET "ilha" = ${ilhaCliente} WHERE "id" = ${n.id}`;
      }
      naviosAtualizados++;
      nomesNavios.push(`${n.nome} (${n.matricula || 'sem matrícula'})`);
    }

    if (nomesNavios.length === 0) continue;

    log.push({
      cliente: c.nome,
      ilhaCliente,
      ilhaFonte: fonte,
      naviosAtualizados: nomesNavios,
    });
  }

  // 3. Navios sem cliente / sem ilha
  const naviosSemCliente = await prisma.navio.count({
    where: {
      clienteId: null,
      ilha: { in: ['', 'N/A', 'N/D', 'N D', 'Desconhecida'] },
    },
  });
  naviosSemIlha = naviosSemCliente;

  // ─── Relatório ────────────────────────────────────────────────────────────
  console.log('─────────────────────────────────────────────────────────────');
  for (const entry of log) {
    console.log(`✦ ${entry.cliente}  →  ${entry.ilhaCliente}  [${entry.ilhaFonte}]`);
    for (const n of entry.naviosAtualizados) {
      console.log(`    • ${n}`);
    }
  }

  console.log('\n=============================================================');
  console.log('✅ RESUMO');
  console.log(`Clientes com ilha derivada de morada ${dryRun ? '(planeados)' : '(atualizados)'}: ${clientesAtualizados}`);
  console.log(`Navios com ilha ${dryRun ? 'planeados' : 'atualizados'}: ${naviosAtualizados}`);
  console.log(`Navios sem cliente (não processados): ${naviosSemIlha}`);
  if (dryRun) {
    console.log('\n⚠️  DRY-RUN — nenhum dado foi alterado.');
    console.log('   Para aplicar, corre com --apply');
  }
  console.log('=============================================================\n');
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
