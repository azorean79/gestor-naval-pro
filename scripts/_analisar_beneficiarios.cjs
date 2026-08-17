const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const mapa = JSON.parse(fs.readFileSync('C:/Users/julio/AppData/Local/Temp/opencode/cfr_map.json', 'utf-8'));
const porCfr = new Map(mapa.map((r) => [r.cfr.toUpperCase(), r]));

function norm(s) {
  return String(s || '')
    .trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

const NOISE = /LIST OF OPERATIONS|LISTA DE OPERA[ÇC][ÕO]ES APROVADAS|Data Última|Atualização/;

(async () => {
  const navios = await p.navio.findMany({ select: { id: true, cfr: true, clienteId: true, nome: true } });
  const clientes = await p.cliente.findMany({ select: { id: true, nome: true, numeroCliente: true } });
  const clientesPorNome = new Map();
  for (const c of clientes) {
    const n = norm(c.nome);
    if (!clientesPorNome.has(n)) clientesPorNome.set(n, []);
    clientesPorNome.get(n).push(c);
  }

  const semCliente = navios.filter((n) => n.clienteId == null && n.cfr && porCfr.has(String(n.cfr).trim().toUpperCase()));

  const benefCount = new Map();
  let comRuido = 0;
  let semBenef = 0;
  for (const n of semCliente) {
    const r = porCfr.get(String(n.cfr).trim().toUpperCase());
    const b = r.beneficiario;
    if (!b || !b.trim()) { semBenef++; continue; }
    if (NOISE.test(b)) comRuido++;
    const key = norm(b);
    benefCount.set(key, (benefCount.get(key) || 0) + 1);
  }

  console.log('Navios sem cliente que ganhariam cliente:', semCliente.length);
  console.log('Com beneficiario com ruido (LIST OF OPERATIONS...):', comRuido);
  console.log('Sem beneficiario:', semBenef);
  console.log('Beneficiarios unicos:', benefCount.size);

  let jacExiste = 0;
  let novoCliente = 0;
  for (const b of benefCount.keys()) {
    if (clientesPorNome.has(b)) jacExiste++; else novoCliente++;
  }
  console.log('Beneficiarios que JA existem como cliente (nome igual):', jacExiste);
  console.log('Beneficiarios que seriam NOVOS clientes:', novoCliente);

  console.log('\nAmostra clientes existentes (nomes):');
  for (const c of clientes.slice(0, 15)) console.log(`  #${c.id} "${c.nome}" (num=${c.numeroCliente || ''})`);

  console.log('\nBeneficiarios com ruido (exemplos):');
  let cnt = 0;
  for (const n of semCliente) {
    const r = porCfr.get(String(n.cfr).trim().toUpperCase());
    if (r.beneficiario && NOISE.test(r.beneficiario)) {
      console.log(`  cfr=${n.cfr} navio=#${n.id} "${n.nome}" benef="${r.beneficiario.slice(0, 80)}"`);
      if (++cnt >= 15) break;
    }
  }

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
