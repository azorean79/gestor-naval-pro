#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ilhaByPostalPrefix: Record<string, string> = {
  '958': 'Santa Maria',
  '950': 'São Miguel', '956': 'São Miguel', '960': 'São Miguel',
  '962': 'São Miguel', '963': 'São Miguel', '965': 'São Miguel', '968': 'São Miguel',
  '970': 'Terceira', '976': 'Terceira',
  '988': 'Graciosa',
  '980': 'São Jorge', '985': 'São Jorge',
  '990': 'Faial',
  '993': 'Pico', '994': 'Pico', '995': 'Pico',
  '996': 'Flores', '997': 'Flores',
  '998': 'Corvo',
};

const directHints: Array<{ ilha: string; patterns: string[] }> = [
  { ilha: 'Santa Maria',  patterns: ['SANTA MARIA', 'VILA DO PORTO'] },
  { ilha: 'São Miguel',   patterns: ['SAO MIGUEL', 'PONTA DELGADA', 'RIBEIRA GRANDE', 'LAGOA', 'VILA FRANCA DO CAMPO', 'NORDESTE', 'POVOACAO'] },
  { ilha: 'Terceira',     patterns: ['TERCEIRA', 'ANGRA DO HEROISMO', 'PRAIA DA VITORIA'] },
  { ilha: 'Graciosa',     patterns: ['GRACIOSA', 'SANTA CRUZ DA GRACIOSA', 'SAO MATEUS DA GRACIOSA'] },
  { ilha: 'São Jorge',    patterns: ['SAO JORGE', 'VELAS', 'CALHETA', 'URZELINA'] },
  { ilha: 'Pico',         patterns: ['PICO', 'MADALENA', 'LAJES DO PICO', 'SAO ROQUE DO PICO'] },
  { ilha: 'Faial',        patterns: ['FAIAL', 'HORTA', 'PRAIA DO ALMOXARIFE', 'CASTELO BRANCO'] },
  { ilha: 'Flores',       patterns: ['FLORES', 'SANTA CRUZ DAS FLORES', 'LAJES DAS FLORES'] },
  { ilha: 'Corvo',        patterns: ['CORVO'] },
];

function norm(v?: string | null) {
  return (v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9\s-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferIlha(text?: string | null): string | null {
  const m = norm(text);
  if (!m) return null;
  for (const h of directHints) if (h.patterns.some((p) => m.includes(p))) return h.ilha;
  const re = /\b(\d{4})-\d{3}\b/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text ?? '')) !== null) {
    const r = ilhaByPostalPrefix[match[1].slice(0, 3)];
    if (r) return r;
  }
  return null;
}

const INVALID = new Set(['', 'N/A', 'N/D', 'N D', 'Desconhecida']);

async function main() {
  console.log('\n📊 DIAGNÓSTICO: CLIENTES SEM ILHA + NAVIOS SEM ILHA\n');

  // Clientes sem ilha com morada inferível
  const clientesSemIlha = await prisma.cliente.findMany({
    where: { ilha: { in: ['', 'N/A', 'N/D', 'Desconhecida'] } },
    select: { id: true, nome: true, ilha: true, morada: true },
    orderBy: { nome: 'asc' },
  });
  const clientesSemIlhaTotal = await prisma.cliente.count({ where: { ilha: { in: ['', 'N/A', 'N/D', 'Desconhecida'] } } });
  // Also count nulls if possible
  const clientesTotal = await prisma.cliente.count();

  let inferiveisClientes = 0;
  console.log(`── Clientes sem ilha inferível pela morada (amostra) ─────────`);
  for (const c of clientesSemIlha) {
    const ilha = inferIlha(c.morada);
    if (ilha) {
      inferiveisClientes++;
      console.log(`  ✦ [ID ${c.id}] ${c.nome} → ${ilha} (morada: ${(c.morada || '').substring(0, 60)})`);
    }
  }
  if (inferiveisClientes === 0) console.log('  ✅ Nenhum cliente com morada inferível restante.');

  // Navios com ilha inválida
  const naviosSemIlha = await prisma.navio.findMany({
    where: { ilha: { in: ['', 'N/A', 'N/D', 'N D', 'Desconhecida'] } },
    select: { id: true, nome: true, matricula: true, ilha: true, clienteId: true },
    orderBy: { nome: 'asc' },
  });

  console.log(`\n── Navios com ilha inválida (${naviosSemIlha.length}) ─────────────────────────`);
  for (const n of naviosSemIlha) {
    const clienteLabel = n.clienteId ? `clienteId=${n.clienteId}` : 'SEM CLIENTE';
    console.log(`  ✗ [ID ${n.id}] ${n.nome} | ${n.matricula || '-'} | ilha="${n.ilha}" | ${clienteLabel}`);
  }
  if (naviosSemIlha.length === 0) console.log('  ✅ Todos os navios têm ilha válida!');

  console.log(`\n=============================================================`);
  console.log(`Clientes totais: ${clientesTotal}`);
  console.log(`Clientes com ilha inválida no campo: ${clientesSemIlhaTotal}`);
  console.log(`  • Encore inferíveis pela morada: ${inferiveisClientes}`);
  console.log(`Navios sem ilha válida: ${naviosSemIlha.length}`);
  console.log(`=============================================================\n`);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
