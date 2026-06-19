#!/usr/bin/env tsx
/**
 * propagar_ilha_cliente_navios.ts
 * Propaga a ilha do cliente para todos os seus navios que não têm ilha válida.
 * Usa comparação normalizada para evitar problemas de Unicode.
 * --apply  → aplica; por defeito é dry-run.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ILHAS_VALIDAS = [
  'Santa Maria', 'São Miguel', 'Terceira', 'Graciosa',
  'São Jorge', 'Pico', 'Faial', 'Flores', 'Corvo',
];

function norm(v?: string | null): string {
  return (v ?? '')
    .normalize('NFC')          // normaliza para NFC
    .replace(/\u00e3/g, 'ã')  // garante ã correcto
    .trim();
}

function ilhaValida(v?: string | null): string | null {
  if (!v) return null;
  const n = norm(v);
  return ILHAS_VALIDAS.find((i) => norm(i) === n) ?? null;
}

function ilhaInvalida(v?: string | null): boolean {
  return !ilhaValida(v);
}

async function main() {
  const dryRun = !process.argv.includes('--apply');
  console.log(`\n🗺️  PROPAGAR ILHA: CLIENTE → NAVIOS  [${dryRun ? 'DRY-RUN' : 'APLICAÇÃO'}]\n`);

  // Buscar todos os navios com clienteId e verificar ilha via JS
  const navios = await prisma.navio.findMany({
    where: { clienteId: { not: null } },
    select: {
      id: true, nome: true, matricula: true, ilha: true,
      cliente: { select: { id: true, nome: true, ilha: true } },
    },
    orderBy: { nome: 'asc' },
  });

  const paraAtualizar: Array<{
    navioId: number; navioNome: string; matricula: string;
    ilhaAtual: string; ilhaCliente: string; clienteNome: string;
  }> = [];

  for (const n of navios) {
    if (!n.cliente) continue;
    const ilhaC = ilhaValida(n.cliente.ilha);
    if (!ilhaC) continue;                // cliente sem ilha válida → salta
    if (!ilhaInvalida(n.ilha)) continue; // navio já tem ilha válida → salta

    paraAtualizar.push({
      navioId: n.id,
      navioNome: n.nome,
      matricula: n.matricula ?? '',
      ilhaAtual: n.ilha,
      ilhaCliente: ilhaC,
      clienteNome: n.cliente.nome,
    });
  }

  // Agrupar por cliente para relatório
  const porCliente: Record<string, typeof paraAtualizar> = {};
  for (const entry of paraAtualizar) {
    if (!porCliente[entry.clienteNome]) porCliente[entry.clienteNome] = [];
    porCliente[entry.clienteNome].push(entry);
  }

  console.log('─────────────────────────────────────────────────────────────');
  for (const [clienteNome, naviosList] of Object.entries(porCliente)) {
    const ilha = naviosList[0].ilhaCliente;
    console.log(`✦ ${clienteNome}  →  ${ilha}`);
    for (const n of naviosList) {
      console.log(`    • ${n.navioNome} (${n.matricula || 'sem matrícula'})  [era: "${n.ilhaAtual}"]`);
    }
  }
  console.log('─────────────────────────────────────────────────────────────');

  if (paraAtualizar.length === 0) {
    console.log('\n✅ Nenhum navio para atualizar.\n');
    await prisma.$disconnect();
    return;
  }

  // Navios sem cliente
  const semCliente = await prisma.navio.count({ where: { clienteId: null } });

  console.log(`\n📊 RESUMO:`);
  console.log(`   Navios a atualizar: ${paraAtualizar.length}`);
  console.log(`   Navios sem cliente (ignorados): ${semCliente}`);

  if (dryRun) {
    console.log('\n⚠️  DRY-RUN — nenhum dado foi alterado.');
    console.log('   Corre com --apply para aplicar.\n');
  } else {
    // Aplicar em lotes
    let atualizados = 0;
    for (const entry of paraAtualizar) {
      await prisma.navio.update({
        where: { id: entry.navioId },
        data: { ilha: entry.ilhaCliente },
      });
      atualizados++;
    }
    console.log(`\n✅ ${atualizados} navios atualizados.\n`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
