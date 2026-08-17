const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

(async () => {
  const total = await p.cliente.count();
  const navios = await p.navio.findMany({ select: { id: true, clienteId: true, cfr: true, matricula: true, estadoNavio: true } });

  const comCliente = navios.filter((n) => n.clienteId != null).length;
  console.log('Clientes totais:', total);
  console.log('Navios com cliente:', comCliente);

  const rel = JSON.parse(fs.readFileSync('D:/Acores/scripts/_associar_clientes_relatorio.json', 'utf-8'));
  const semBenef = rel.filter((r) => r.status === 'SEM_BENEFICIARIO');
  console.log('Navios SEM beneficiario valido (nao associados):', semBenef.length);
  for (const r of semBenef.slice(0, 15)) console.log(`  #${r.id} ${r.nome} | cfr=${r.cfr} | benef_raw="${(r.beneficiario || '').slice(0, 60)}"`);

  const ok = rel.filter((r) => r.status === 'OK');
  const nomes = ok.map((r) => r.beneficiario);
  const dups = {};
  for (const n of nomes) {
    const k = String(n).trim().toUpperCase();
    dups[k] = (dups[k] || 0) + 1;
  }
  const multi = Object.entries(dups).filter(([, v]) => v > 1);
  console.log('\nBeneficiarios com mais de um navio:', multi.length);

  const clientes = await p.cliente.findMany({ select: { id: true, nome: true } });
  const nomesCli = clientes.map((c) => String(c.nome).trim().toUpperCase());
  const set = new Set();
  const colisoes = nomesCli.filter((n) => { if (set.has(n)) return true; set.add(n); return false; });
  console.log('Colisoes de nome de cliente (exatas, uppercase):', colisoes.length);
  for (const c of colisoes.slice(0, 15)) console.log(`  ${c}`);

  const semCfr = navios.filter((n) => !n.cfr || !String(n.cfr).trim());
  console.log('\nNavios sem cfr:', semCfr.length);
  console.log('Navios sem cfr COM cliente:', semCfr.filter((n) => n.clienteId != null).length);

  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
