/**
 * Backfill re-executável: sincroniza o `numeroCliente` dos Clientes com o
 * `numeroClienteExterno` presente nos `metadados` das Ordens de Serviço e Faturas
 * (importadas de FATURACAO 15-22, etc.).
 *
 * Regras (iguais às do middleware em src/lib/sync-cliente-numero.ts):
 *  - Apenas define o número quando o atual é placeholder (Cxxx) ou está vazio.
 *  - Não sobrepõe um número real já atribuído.
 *  - Não rouba um número já usado por outro cliente.
 *
 * Uso:
 *   node scripts/sync_cliente_numero_from_ordens.cjs          # aplica
 *   node scripts/sync_cliente_numero_from_ordens.cjs --dry-run # só relatório
 */
const { PrismaClient } = require('@prisma/client');

const PLACEHOLDER_RE = /^C\d+$/i;
const DRY_RUN = process.argv.includes('--dry-run');

function extractNumeroClienteExterno(metadados) {
  if (typeof metadados !== 'string' || !metadados.includes('numeroClienteExterno')) return null;
  try {
    const m = JSON.parse(metadados);
    return m.numeroClienteExterno ? String(m.numeroClienteExterno) : null;
  } catch {
    return null;
  }
}

async function main() {
  const prisma = new PrismaClient();
  let updated = 0;
  let skippedReal = 0;
  let skippedClash = 0;
  const report = [];

  // Clientes com número atual (para detetar colisões e placeholders)
  const clientes = await prisma.cliente.findMany({ select: { id: true, nome: true, numeroCliente: true } });
  const byId = new Map(clientes.map((c) => [c.id, c]));
  const usedNC = new Map();
  for (const c of clientes) if (c.numeroCliente) usedNC.set(c.numeroCliente, c.id);

  // Recolher número externo por cliente (a partir de ordens e faturas)
  const sources = await prisma.$transaction([
    prisma.ordemServico.findMany({ where: { metadados: { contains: 'numeroClienteExterno' } }, select: { clienteId: true, metadados: true } }),
    prisma.fatura.findMany({ where: { metadados: { contains: 'numeroClienteExterno' } }, select: { clienteId: true, metadados: true } }),
  ]);
  const rows = [...sources[0], ...sources[1]];

  const byCliente = new Map();
  for (const r of rows) {
    if (!r.clienteId) continue;
    const ext = extractNumeroClienteExterno(r.metadados);
    if (!ext) continue;
    if (!byCliente.has(r.clienteId)) byCliente.set(r.clienteId, new Set());
    byCliente.get(r.clienteId).add(ext);
  }

  for (const [clienteId, exts] of byCliente) {
    const cliente = byId.get(clienteId);
    if (!cliente) continue;
    if (exts.size !== 1) {
      // ambíguo: ignorar (igual ao critério manual)
      report.push({ id: clienteId, nome: cliente.nome, status: 'AMBIGUO', exts: [...exts] });
      continue;
    }
    const target = [...exts][0];
    const cur = cliente.numeroCliente;
    if (cur && cur === target) continue; // já correto
    if (cur && !PLACEHOLDER_RE.test(cur)) { skippedReal++; report.push({ id: clienteId, nome: cliente.nome, status: 'MANTER_REAL', cur, target }); continue; }
    if (usedNC.has(target) && usedNC.get(target) !== clienteId) { skippedClash++; report.push({ id: clienteId, nome: cliente.nome, status: 'COLISAO', target }); continue; }

    if (DRY_RUN) {
      report.push({ id: clienteId, nome: cliente.nome, status: 'UPDATE(dry)', cur: cur || null, target });
      continue;
    }
    await prisma.cliente.update({ where: { id: clienteId }, data: { numeroCliente: target } });
    usedNC.set(target, clienteId);
    updated++;
    report.push({ id: clienteId, nome: cliente.nome, status: 'UPDATE', cur: cur || null, target });
  }

  console.log(`\n=== Sync cliente.numeroCliente (${DRY_RUN ? 'DRY-RUN' : 'APLICADO'}) ===`);
  console.log(`Atualizados: ${updated}`);
  console.log(`Ignorados (número real já existente): ${skippedReal}`);
  console.log(`Ignorados (colisão com outro cliente): ${skippedClash}`);
  console.log(`Ambíguos (skip): ${report.filter((r) => r.status === 'AMBIGUO').length}`);
  console.log('\nDetalhe:');
  for (const r of report) console.log(`  [${r.status}] #${r.id} ${r.nome} ${r.cur ? '(' + r.cur + ' -> ' : '(vazio -> '}${r.target}${r.exts ? ' exts=' + JSON.stringify(r.exts) : ''})`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
