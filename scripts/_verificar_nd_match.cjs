const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ datasources: { db: { url: 'file:./local.db' } } });

const PLANO = [
  { id: 748, matricula: 'H-533-L', cfr: 'PRT000024642', fonte: 'apoios (Rui Fernando Bettencourt Cardoso)' },
  { id: 782, matricula: 'PTSCG-118330-C', cfr: 'PRT000024561', fonte: 'DGRM embarcacoes_acores + apoios (Valentino Benjamim)' },
  { id: 857, matricula: 'F-1102-L', cfr: 'PRT000023140', fonte: 'apoios (BELUGA, F-1102-L)' },
  { id: 876, matricula: 'PTPDL-118566-C', cfr: 'PRT000017427', fonte: 'DGRM embarcacoes_acores (Santo Cristo I)' },
];

(async () => {
  const todas = await p.navio.findMany({ select: { id: true, nome: true, matricula: true } });
  for (const plano of PLANO) {
    const n = await p.navio.findUnique({ where: { id: plano.id }, include: { cliente: { select: { id: true, nome: true } } } });
    const colisao = todas.filter((t) => t.matricula === plano.matricula && t.id !== plano.id);
    const jangadas = await p.jangada.count({ where: { shipId: plano.id } });
    console.log(`#${n.id} ${n.nome} | ilha=${n.ilha || '(vazio)'} | cliente=${n.clienteId} ${n.cliente?.nome || ''} | jangadas=${jangadas}`);
    console.log(`   -> ${plano.matricula} | ${plano.cfr}  [${plano.fonte}]  colisao=${colisao.length ? colisao.map((c) => `#${c.id} ${c.nome}`).join(',') : 'nenhuma'}`);
  }
  await p.$disconnect();
})().catch((e) => { console.error(e); p.$disconnect(); process.exit(1); });
