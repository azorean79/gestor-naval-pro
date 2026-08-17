const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const MAP_FILE = 'C:/Users/julio/AppData/Local/Temp/opencode/cfr_map.json';
const MAPA = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
const porCfr = new Map(MAPA.map((r) => [r.cfr.toUpperCase(), r]));

const NOISE_HEADER = /LIST\s*OF\s*OPERATIONS|LISTA\s*DE\s*OPERA[ÇC][ÕO]ES\s*APROVADAS|^\s*\d{1,2}\.\w+\.\d{4}\s*/i;
const PURE_NOISE = /^(LISTA?|OPERACOES?|PORTUGAL|PA[ÍI]S|DATA|ATUALIZA[ÇC][ÃA]O|UNIDADE|EURO)$/i;

function normalizarNome(s) {
  return String(s || '')
    .trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function limparBeneficiario(raw) {
  let s = String(raw || '');
  s = s.replace(NOISE_HEADER, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/^[\s,;.\-–—]+|[\s,;.\-–—]+$/g, '');
  return s;
}

(async () => {
  const navios = await p.navio.findMany({ select: { id: true, nome: true, cfr: true, clienteId: true, ilha: true } });
  const clientes = await p.cliente.findMany({ select: { id: true, nome: true } });

  const clientesPorNome = new Map();
  for (const c of clientes) {
    const n = normalizarNome(c.nome);
    if (!clientesPorNome.has(n)) clientesPorNome.set(n, []);
    clientesPorNome.get(n).push(c);
  }

  const alvo = navios.filter((n) =>
    n.clienteId == null &&
    n.cfr &&
    porCfr.has(String(n.cfr).trim().toUpperCase())
  );

  console.log('Navios alvo:', alvo.length);

  const relatorio = [];
  let reutilizados = 0;
  let criados = 0;
  let semBenef = 0;
  let erros = 0;

  for (const n of alvo) {
    const r = porCfr.get(String(n.cfr).trim().toUpperCase());
    const nomeBenef = limparBeneficiario(r.beneficiario);
    const key = normalizarNome(nomeBenef);

    if (!key || PURE_NOISE.test(nomeBenef)) {
      semBenef++;
      relatorio.push({ id: n.id, nome: n.nome, cfr: n.cfr, status: 'SEM_BENEFICIARIO', beneficiario: r.beneficiario });
      continue;
    }

    let cliente = null;
    if (clientesPorNome.has(key)) {
      cliente = clientesPorNome.get(key)[0];
      reutilizados++;
    } else {
      try {
        cliente = await p.cliente.create({
          data: {
            nome: nomeBenef,
            serviceStationId: 1,
            ilha: n.ilha || undefined,
          },
        });
        clientesPorNome.set(key, [cliente]);
        criados++;
      } catch (e) {
        erros++;
        relatorio.push({ id: n.id, nome: n.nome, cfr: n.cfr, status: 'ERRO_CRIAR', beneficiario: nomeBenef, erro: String(e.message).slice(0, 120) });
        continue;
      }
    }

    await p.navio.update({ where: { id: n.id }, data: { clienteId: cliente.id } });
    relatorio.push({ id: n.id, nome: n.nome, cfr: n.cfr, status: 'OK', clienteId: cliente.id, beneficiario: nomeBenef });
  }

  console.log('Clientes reutilizados:', reutilizados);
  console.log('Clientes criados:', criados);
  console.log('Sem beneficiario valido:', semBenef);
  console.log('Erros:', erros);

  fs.writeFileSync('D:/Acores/scripts/_associar_clientes_relatorio.json', JSON.stringify(relatorio, null, 1));
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
